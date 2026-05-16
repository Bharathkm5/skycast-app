const express = require('express');
const router = express.Router();

const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

router.post('/chat', async (req, res) => {

  try {

    const {
      message,
      weather,
      city
    } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message required'
      });
    }

    const weatherText = weather
      ? `
Current Weather Data:

City: ${city}

Temperature: ${weather.main?.temp}°C
Feels Like: ${weather.main?.feels_like}°C
Humidity: ${weather.main?.humidity}%
Weather: ${weather.weather?.[0]?.description}
Wind Speed: ${weather.wind?.speed} m/s
`
      : 'No weather data available';

    const completion =
      await groq.chat.completions.create({

        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `
You are SkyCast AI.

You are a friendly weather assistant.

You explain weather in simple words.

You can answer:
- weather questions
- travel advice
- clothing suggestions
- outdoor activity suggestions
- rain alerts
- heat alerts
- safety tips
- general questions

Keep answers short and clear.
`
          },

          {
            role: 'user',
            content: `
${weatherText}

User Question:
${message}
`
          }
        ],

        temperature: 0.7,
        max_tokens: 300,
      });

    const reply =
      completion.choices[0].message.content;

    res.json({
      reply
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;