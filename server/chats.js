const path = require('path');
const fs = require('fs').promises;
const { Router } = require('express');

const {
  USER_DATA_DIR,
  FILENAMES,
  OPEN_AI,
  IMAGES,
} = require('./constants');


const router = new Router();


router.get('/users/:participantId/tasks/:taskIndex/chats/messages', async (req, res) => {
  try {
    const { participantId, taskIndex } = req.params;
    const userDir = path.join(USER_DATA_DIR, participantId);
    const chatHistoryFilePath = path.join(userDir, FILENAMES.CHAT_HISTORY);

    const chatData = { };
    try {
      const fileContent = JSON.parse(await fs.readFile(chatHistoryFilePath));
      Object.assign(chatData, fileContent || { })
    } catch (err) {
      if (!err.code || err.code !== 'ENOENT') {
        throw err;
      }
    }

    const latest = req.query.latest != null;

    if (!chatData[taskIndex]) {
      return res.json([ ]);
      // return res.status(404).json({ error: 'Not chat found' });
    }

    if (chatData[taskIndex].history.length < 1) {
      return res.json([ ]);
      // return res.status(404).json({ message: 'No chat history found for this user.' });
    }

    if (latest) {
      return res.json(chatData[taskIndex].history[chatData[taskIndex].history.length - 1]);
    } else {
      return res.json(chatData[taskIndex].history.slice(chatData[taskIndex].history.length - 25));
    }
  } catch (err) {
    req.logger.error('Error while retrieving chat history.', err);
    return res.status(500).json({
      message: 'Error while retrieving chat history.',
    });
  }
});


router.post('/users/:participantId/tasks/:taskIndex/chats/messages', async (req, res) => {
  try {
    const { message } = req.body;
    const { participantId, taskIndex } = req.params;

    const userDir = path.join(USER_DATA_DIR, participantId);
    const taskFilePath = path.join(userDir, FILENAMES.TASKS);
    const chatHistoryFilePath = path.join(userDir, FILENAMES.CHAT_HISTORY);


    const taskData = { tasks: [ ] };

    try {
      const fileContent = JSON.parse(await fs.readFile(taskFilePath));
      Object.assign(taskData, fileContent || { })
    } catch (err) {
      if (!err.code || err.code !== 'ENOENT') {
        throw err;
      }
    }

    const task = taskData.tasks[taskIndex];
    const image = task.image;
    const imageId = IMAGES[image.id].openAIId;

    const chat = { };
    try {
      const fileContent = JSON.parse(await fs.readFile(chatHistoryFilePath));
      Object.assign(chat, fileContent || { })
    } catch (err) {
      if (!err.code || err.code !== 'ENOENT') {
        throw err;
      }
    }

    if (!chat[taskIndex]) {
      chat[taskIndex] = { history: [ ] };
    }

    if (!chat[taskIndex].thread || !chat[taskIndex].thread.id) {
      chat[taskIndex].thread = await req.openai.beta.threads.create();
    }

    const payload = {
      role: 'user',
      content: [
        {
          type: 'image_file',
          image_file: {
            file_id: imageId,
          }
        },
        {
          type: 'text',
          text: message
        },
      ]
    };
    console.info(payload);
    await req.openai.beta.threads.messages.create(chat[taskIndex].thread.id, payload);

    let responseText = '';

    req.openai.beta.threads.runs.stream(chat[taskIndex].thread.id, {
      assistant_id: OPEN_AI.CHAT_ASSISTANT,
    })
      .on('textDelta', (textDelta) => {
        process.stdout.write(textDelta.value)

        responseText += textDelta.value;
      })
      .on('end', async () => {
        if (!res.headersSent) {
          req.logger.info(`OpenAI Response: ${responseText}`);

          chat[taskIndex].history.push({
            message,
            response: responseText,
            timestamp: new Date().toISOString(),
            threadId: chat[taskIndex].thread.id,
          });

          await fs.writeFile(chatHistoryFilePath, JSON.stringify(chat));

          res.json({ response: responseText, threadId: chat[taskIndex].thread.id });
        }
      })
      .on('error', (err) => {
        if (!res.headersSent) {
          req.logger.error(err);
          res.status(500).json({
            error: 'Failed to process request'
          });
        }
      });

  } catch (err) {
    if (!res.headersSent) {
      req.logger.error(err);
      res.status(500).json({
        error: 'Failed to process request'
      });
    }
  }
});


/**
 * Clear the chat history. In actuality the history is not fully cleared
 * but copied to a backup file.
 */
router.delete('/users/:participantId/tasks/:taskIndex/chats/messages', async (req, res) => {
  try {
    const { participantId, taskIndex } = req.params;

    const userDir = path.join(USER_DATA_DIR, participantId);
    const chatHistoryFilePath = path.join(userDir, FILENAMES.CHAT_HISTORY);

    const chatData = { };
    try {
      const fileContent = JSON.parse(await fs.readFile(chatHistoryFilePath));
      Object.assign(chatData, fileContent || { })
    } catch (err) {
      if (!err.code || err.code !== 'ENOENT') {
        throw err;
      }
    }

    if (!chatData[taskIndex] || !chatData[taskIndex].history || chatData[taskIndex].history.length < 1) {
      return res.status(404).json({ message: 'No chat history found.' });
    }

    const latest = req.query.latest != null;

    const newChatHistory = latest ? chatData[taskIndex].history.slice(0, -1) : [ ];

    const backupFilePath = path.join(userDir, FILENAMES.CHAT_BACKUP());
    if (fs.existsSync(chatHistoryFilePath)) {
      await fs.copyFile(chatHistoryFilePath, backupFilePath);
    }

    chatData[taskIndex].history = newChatHistory;
    fs.writeFile(chatHistoryFilePath, JSON.stringify(chatData));

    res.status(200).json({ message: 'Chat history cleared successfully' });
  } catch (err) {
    req.logger.error('Error while clearing chat history.', err);
    return res.status(500).json({
      message: 'Error while clearing chat history.',
    });
  }
});


// New OpenAI endpoint for a different assistant
router.post('/users/:participantId/tasks/:taskIndex/chats/json', async (req, res) => {
  try {
    const { message } = req.body;
    const { participantId, taskIndex } = req.params;

    const userDir = path.join(USER_DATA_DIR, participantId);
    const ideaFilePath = path.join(userDir, FILENAMES.IDEAS);

    // Try to open idea file. If the file does not exists, fall back to default
    const ideas = { };
    try {
      const fileContent = JSON.parse(await fs.readFile(ideaFilePath));
      Object.assign(ideas, fileContent || { })
    } catch (err) {
      if (!err.code || err.code !== 'ENOENT') {
        throw err;
      }
    }

    if (!ideas[taskIndex]) {
      ideas[taskIndex] = { ideas: [ ] };
    }

    const ideasForTask = ideas[taskIndex];

    // Start a new thread if necessary
    if (!ideasForTask.thread || !ideasForTask.thread.id) {
      ideasForTask.thread = await req.openai.beta.threads.create();
    }

    await req.openai.beta.threads.messages.create(ideasForTask.thread.id, {
      role: 'user',
      content: message,
    });

    const run = req.openai.beta.threads.runs.stream(ideasForTask.thread.id, {
      assistant_id: OPEN_AI.AUXILIARY_ASSISTANT,
    });

    let responseText = '';

    run
      .on('textDelta', (textDelta) => responseText += textDelta.value)
      .on('end', async () => {
        if (!res.headersSent) {
          req.logger.info(`OpenAI New Assistant Response: ${responseText}`);

          // ideasForTask.ideas.push(responseText);

          // await fs.writeFile(ideaFilePath, JSON.stringify(ideas));

          res.json({ response: responseText });
        }
      })
      .on('error', (err) => {
        if (!res.headersSent) {
          req.logger.error(err);
          res.status(500).json({ error: 'Failed to process request' });
        }
      });

  } catch (err) {
    if (!res.headersSent) {
      req.logger.error(err);
      res.status(500).json({ error: 'Failed to process request' });
    }
  }
});

module.exports = router;