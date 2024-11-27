const path = require('path');
const fs = require('fs').promises;
const uuid = require('uuid');
const { Router } = require('express');

const { FILENAMES, USER_DATA_DIR, TASKS, IMAGES } = require('./constants');

const router = new Router();


function shuffle(array) {
  array = array.slice();
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}


const TOPICS = [
  'work',
  'food',
  'sports',
]

const TOTAL_NUMBER_OF_TASKS_PER_PARTICIPANT = 3;

function getTasks () {
  const shuffledTopics = shuffle(TOPICS).slice(0, TOTAL_NUMBER_OF_TASKS_PER_PARTICIPANT);
  const shuffledImages = shuffle(IMAGES).slice(0, TOTAL_NUMBER_OF_TASKS_PER_PARTICIPANT);
  const isBaseline = Math.random() > 0.5;
  return shuffledTopics.map((topic, i) => ({
    index: i,
    topic,
    image: shuffledImages[i],
    completed: false,
    isBaseline,
    description: isBaseline ? TASKS.BASELINE(topic) : TASKS.TREATMENT(topic),
    timers: {
      generateIdeas: null,
      pickFavorites: null,
      generateImages: null,
    },
  }));
}


/**
 * Endpoint for submitting the inital consent form.
 * If a user ID is provided, we continue using it. Otherwise, create new user id
 */
router.post('/consent', async (req, res) => {
  const participantId = req.body.participantId || req.query.participant_id || uuid.v4();
  const consentGiven = req.body.consent;

  try {
    if (consentGiven) {
      const userDir = path.join(USER_DATA_DIR, participantId);
      try {
        console.info('Creating', userDir)
        await fs.mkdir(userDir);
      } catch (err) {
        // Ignore EEXISTS errors
      }

      const consetFilePath = path.join(userDir, FILENAMES.CONSENT);
      await fs.writeFile(consetFilePath, new Date().toISOString());


      const taskFilePath = path.join(userDir, FILENAMES.TASKS);
      const taskData = { tasks: [ ] };

      try {
        const fileContent = JSON.parse(await fs.readFile(taskFilePath));
        Object.assign(taskData, fileContent || { })
      } catch (err) {
        if (!err.code || err.code !== 'ENOENT') {
          throw err;
        }
      }

      if (taskData.tasks.length !== 3) {
        await fs.writeFile(taskFilePath, JSON.stringify({ tasks: getTasks() }));
      }

      return res.status(200).json({
        participantId,
      });
    } else {
      return res.status(400).json({
        message: 'Please consent to the data policy.',
      });
    }
  } catch (err) {
    req.logger.error('Error during consent.', err);
    return res.status(500).json({
      message: 'Error during consent.',
    });
  }
});


/**
 * Endpoint for submitting demographic info if necessary.
 * Data is stored in a json file on disc in a user specific dir.
 */
router.post('/users/:participantId', async (req, res) => {
  try {
    const { participantId } = req.params;
    const { age, gender, location } = req.body;

    // Ensure participantId is provided
    if (!participantId) {
      return res.status(400).json({
        message: 'Participant ID is required.',
      });
    }

    const newUser = {
      id: participantId, // Use participantId as the user ID
      age,
      gender,
      location,
      submittedAt: new Date().toISOString(),
      consent: true,
    };

    const userDir = path.join(USER_DATA_DIR, participantId);
    try {
      await fs.mkdir(userDir);
    } catch (err) {
      // Ignore EEXISTS errors
    }

    const infoFilePath = path.join(userDir, FILENAMES.USERINFO);
    let fileContent = { };

    try {
      fileContent = JSON.parse(await fs.readFile(infoFilePath));
    } catch (err) {
      if (!err.code || err.code !== 'ENOENT') {
        throw err;
      }
    }

    const newContent = Object.assign(fileContent, newUser);

    await fs.writeFile(infoFilePath, JSON.stringify(newContent));

    req.logger.info(`New user info saved in ${infoFilePath}`);

    return res.status(200).json({
      message: "User info saved successfully!",
      id: newUser.id,
      submittedAt: newUser.submittedAt,
    });
  } catch (err) {
    req.logger.error('Error during processing of the data.', err);
    return res.status(500).json({
      message: 'Error during processing of the data.',
    });
  }
});


router.post('/users/:participantId/timings', async (req, res) => {
  try {
    const { participantId } = req.params
    const { action, timestamp } = req.body;

    const userDir = path.join(USER_DATA_DIR, participantId);
    try {
      await fs.mkdir(userDir);
    } catch (err) {
      // Ignore EEXISTS errors
    }

    const timingFilePath = path.join(userDir, FILENAMES.TIMINGLOG);
    let fileContent = [ ];
    try {
      fileContent = JSON.parse(await fs.readFile(timingFilePath));
    } catch (err) {
      if (!err.code || err.code !== 'ENOENT') {
        throw err;
      }
    }
    fileContent.push({ step: action, timestamp });

    await fs.writeFile(timingFilePath, JSON.stringify(fileContent));

    return res.status(201).end();
  } catch (err) {
    req.logger.error('Error during processing of timing data.', err);
    return res.status(500).json({
      message: 'Error during processing of timing data.',
    });
  }
});


router.get('/users/:participantId/tasks', async (req, res) => {
  try {
    const { participantId } = req.params;
    const nextTaskOnly = req.query.next != null;

    const userDir = path.join(USER_DATA_DIR, participantId);
    const taskFilePath = path.join(userDir, FILENAMES.TASKS);

    const taskData = { tasks: [ ] };

    try {
      const fileContent = JSON.parse(await fs.readFile(taskFilePath));
      Object.assign(taskData, fileContent || { })
    } catch (err) {
      if (!err.code || err.code !== 'ENOENT') {
        throw err;
      }
    }

    if (nextTaskOnly) {
      const incompleteTasks = taskData.tasks.filter(({ completed }) => !completed);
      if (incompleteTasks.length < 1) {
        return res.status(200).json(null);
      }
      return res.json(incompleteTasks[0]);
    }

    return res.json(taskData.tasks);

  } catch (err) {
    req.logger.error(err);
    res.status(500).json({
      error: 'Failed to load tasks',
    });
  }

});


router.put('/users/:participantId/tasks/:index', async (req, res) => {
  try {
    const { participantId, index } = req.params;
    const updatedTask = req.body;

    const userDir = path.join(USER_DATA_DIR, participantId);
    const taskFilePath = path.join(userDir, FILENAMES.TASKS);

    const taskData = { tasks: [ ] };

    try {
      const fileContent = JSON.parse(await fs.readFile(taskFilePath));
      Object.assign(taskData, fileContent || { })
    } catch (err) {
      if (!err.code || err.code !== 'ENOENT') {
        throw err;
      }
    }

    const taskAtIndex = taskData.tasks[index];

    if (taskAtIndex) {
      Object.assign(taskAtIndex, updatedTask);
      await fs.writeFile(taskFilePath, JSON.stringify(taskData));

      return res.json(taskAtIndex);
    }

    return res.status(404).json({ error: 'Task not found' });

  } catch (err) {
    req.logger.error(err);
    res.status(500).json({
      error: 'Failed to load tasks',
    });
  }

});

module.exports = router;