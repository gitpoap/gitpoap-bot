import express from 'express';
import { getBotInstalls } from '../../src/stats';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/stats/bot-installs', async (req, res) => {
  try {
    const botInstalls = await getBotInstalls();

    return res.status(200).send({ totalInstalls: botInstalls.length, urls: botInstalls });
  } catch (err) {
    return res.status(500).send({ msg: `Failed to retrieve installs: ${err}` });
  }
});

module.exports = app;
