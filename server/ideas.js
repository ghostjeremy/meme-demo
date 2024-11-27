const path = require('path');
const fs = require('fs').promises;
const uuid = require('uuid');

const { Router } = require('express');
const { FILENAMES, USER_DATA_DIR } = require('./constants');


const router = new Router();


router.get('/users/:participantId/tasks/:taskIndex/ideas', async (req, res) => {
  try {
    const { participantId, taskIndex } = req.params;

    const userDir = path.join(USER_DATA_DIR, participantId);
    const ideaFilePath = path.join(userDir, FILENAMES.IDEAS);

    const ideaData = { }; // { thread: { id: null }, ideas: [ ] };
    try {
      const fileContent = JSON.parse(await fs.readFile(ideaFilePath));
      Object.assign(ideaData, fileContent || { })
    } catch (err) {
      if (!err.code || err.code !== 'ENOENT') {
        throw err;
      }
    }

    const ideasForTask = ideaData[taskIndex];

    if (!ideasForTask) {
      return res.status(200).json([ ]);
      // return res.status(404).json({ error: 'No ideas found' });
    }

    const latest = req.query.latest != null;

    if (latest) {
      return res.json(ideasForTask.ideas[ideasForTask.ideas.length - 1]);
    }

    const filterFunctions = [ ];

    const selectLiked = req.query.liked != null;
    if (selectLiked) {
      filterFunctions.push(({ liked }) => liked);
    }

    const selectFavourite = req.query.favourites != null;
    if (selectFavourite) {
      filterFunctions.push(({ favourite }) => Boolean(favourite));
    }

    return res.json(filterFunctions.reduce((ideas, filterFn) => ideas.filter(filterFn), ideasForTask.ideas));
  } catch (err) {
    req.logger.error('Error while retrieving idea list.', err);
    return res.status(500).json({
      message: 'Error while retrieving idea list.',
    });
  }
});


router.post('/users/:participantId/tasks/:taskIndex/ideas', async (req, res) => {
  try {
    const { text: ideaText } = req.body;
    const { participantId, taskIndex } = req.params;

    const userDir = path.join(USER_DATA_DIR, participantId);
    const ideaFilePath = path.join(userDir, FILENAMES.IDEAS);

    const ideaData = { };
    try {
      const fileContent = JSON.parse(await fs.readFile(ideaFilePath));
      Object.assign(ideaData, fileContent || { })
    } catch (err) {
      if (!err.code || err.code !== 'ENOENT') {
        throw err;
      }
    }

    if (!ideaData[taskIndex]) {
      ideaData[taskIndex] = { ideas: [ ] };
    }

    const ideasForTask = ideaData[taskIndex];

    const idea = { text: ideaText, id: uuid.v4(), liked: false };
    ideasForTask.ideas.push(idea);

    await fs.writeFile(ideaFilePath, JSON.stringify(ideaData));

    return res.status(201).json(idea);
  } catch (err) {
    req.logger.error('Error while storing new idea.', err);
    return res.status(500).json({
      message: 'Error while storing new idea.',
    });
  }
});


router.put('/users/:participantId/tasks/:taskIndex/ideas/:ideaId', async (req, res) => {
  try {
    const idea = req.body;
    const { participantId, ideaId, taskIndex } = req.params;

    const userDir = path.join(USER_DATA_DIR, participantId);
    const ideaFilePath = path.join(userDir, FILENAMES.IDEAS);

    const ideaData = { };

    try {
      const fileContent = JSON.parse(await fs.readFile(ideaFilePath));
      Object.assign(ideaData, fileContent || { })
    } catch (err) {
      if (!err.code || err.code !== 'ENOENT') {
        throw err;
      }
    }

    const ideasForTask = ideaData[taskIndex];

    if (!ideasForTask) {
      return res.status(404).json({ error: 'No ideas found' });
    }

    const existingIdea = ideasForTask.ideas.find(({ id }) => id === ideaId);

    if (!existingIdea) {
      return res.status(404).json({ error: 'idea not found' });
    }

    Object.assign(existingIdea, idea);
    existingIdea.id = ideaId;

    await fs.writeFile(ideaFilePath, JSON.stringify(ideaData));

    return res.status(200).json(existingIdea);
  } catch (err) {
    req.logger.error('Error while storing new idea.', err);
    return res.status(500).json({
      message: 'Error while storing new idea.',
    });
  }
});


router.delete('/users/:participantId/tasks/:taskIndex/ideas/:ideaId', async (req, res) => {
  try {
    const { participantId, ideaId, taskIndex } = req.params;

    const userDir = path.join(USER_DATA_DIR, participantId);
    const ideaFilePath = path.join(userDir, FILENAMES.IDEAS);

    const ideaData = { };

    try {
      const fileContent = JSON.parse(await fs.readFile(ideaFilePath));
      Object.assign(ideaData, fileContent || { })
    } catch (err) {
      if (!err.code || err.code !== 'ENOENT') {
        throw err;
      }
    }

    const ideasForTask = ideaData[taskIndex];

    if (!ideasForTask) {
      return res.status(404).json({ error: 'No ideas found' });
    }

    const filteredIdeas = ideasForTask.ideas.filter(({ id }) => id !== ideaId);
    ideasForTask.ideas = filteredIdeas;
    await fs.writeFile(ideaFilePath, JSON.stringify(ideaData));

    return res.status(201).end();
  } catch (err) {
    req.logger.error('Error while removing idea.', err);
    return res.status(500).json({
      message: 'Error while storing removing idea.',
    });
  }
});


module.exports = router;