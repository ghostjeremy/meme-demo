const PORT = 8000;

const express = require('express');
const cors = require('cors');
const winston = require('winston');
const OpenAI = require('openai');

const compression = require('compression');
const helmet = require('helmet');
const RateLimit = require("express-rate-limit");

const userManagementRouter = require('./server/user-management');
const chatRouter = require('./server/chats');
const ideasRouter = require('./server/ideas');
const imageRouter = require('./server/images');
const { OPEN_AI, URL_PREFIX } = require('./server/constants');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(helmet.contentSecurityPolicy());

const limiter = RateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
});
app.use(limiter);
app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));
require('dotenv').config();

const openai = new OpenAI({ apiKey: OPEN_AI.API_KEY });

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console()
  ],
});

app.use((req, res, next) => {
  req.logger = logger;
  req.openai = openai;

  return next();
});


app.use(URL_PREFIX, userManagementRouter);
app.use(URL_PREFIX, chatRouter);
app.use(URL_PREFIX, ideasRouter);
app.use(URL_PREFIX, imageRouter);

app.listen(PORT, () => {
  logger.info(`Server started and listening on port ${PORT}`);
  console.log(`Server started and listening on port ${PORT}`);
});