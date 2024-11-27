const fs = require('fs');
const path = require('path');

const USER_DATA_DIR = path.join(__dirname, '..', 'data');
const IMAGES_DIR = path.join(__dirname, '..', 'images');

[
  USER_DATA_DIR,
  IMAGES_DIR,
].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

module.exports = {
  URL_PREFIX: '/api',
  USER_DATA_DIR,
  IMAGES_DIR,

  FILENAMES: {
    CONSENT: 'consent',
    CHAT_HISTORY: 'chat.json',
    IDEAS: 'ideas.json',
    CHAT_BACKUP: () => `${new Date().toISOString().slice(0, 19)}-chat.backup.json`,
    USERINFO: 'userinfo.json',
    TIMINGLOG: 'timings.json',
    TASKS: 'tasks.json',
  },

  IMAGES: [
    { id: 0, openAIId: 'file-c1xfJ3bjdbjh2aZEYNOy3Xlo', url: '/meme-templates/baby.jpg' },
    { id: 1, openAIId: 'file-1XEugoKZVX9detgMUmxDwdyz', url: '/meme-templates/boromir.jpg' },
    { id: 2, openAIId: 'file-GzmOlOHLKAlK4I8wefQlYiNC', url: '/meme-templates/choice.jpg' },
    { id: 3, openAIId: 'file-VrvkKOX5PStGLDOAyIguxaef', url: '/meme-templates/doge.jpg' },
    { id: 4, openAIId: 'file-36p1ZTZ2BSuCNiIBf4sl5Wfg', url: '/meme-templates/futurama.jpg' },
    { id: 5, openAIId: 'file-Ktf1xU8O7oUUj6bYO21RNoht', url: '/meme-templates/toy-story.jpg' },
  ],

  OPEN_AI: {
    API_KEY: process.env.OPENAI_KEY,
    CHAT_ASSISTANT: process.env.ASSISTANT_ID,
    AUXILIARY_ASSISTANT: process.env.JSON_ASSISTANT_ID,
  },
  TASKS: {
    BASELINE: (topic) => [
      { text: 'Please come up with as many funny or interesting captions for the picture above.' },
      { text: `The captions you create should be about the topic of ${topic}.`, highlight: true },
      { text: 'Use the list on the right to record all your ideas.' },
      { text: 'Please use 4-5 minutes to come up with as many ideas as possible.' },
    ],
    TREATMENT: (topic) => [
      { text: 'Please come up with as many funny or interesting captions for the picture above.' },
      { text: `The captions you create should be about the topic of ${topic}.`, highlight: true },
      { text: 'You can use the chatbot to the right to help you come up with ideas or just add your own to the list.' },
      { text: 'Use the list on the right to record all ideas.' },
      { text: 'Please use 4-5 minutes to come up with as many ideas as possible.' },
    ]
  }
};