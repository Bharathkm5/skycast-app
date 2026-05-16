const express = require('express');
const router = express.Router();

const axios = require('axios');

const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* =========================
   DETECT CITY FROM MESSAGE
========================= */

function extractCity(message){

  if(!message) return null;

  const lower =
    message.toLowerCase();

  const cleaned =
    lower.replace(/[^\w\s]/g,'');

  const words =
    cleaned.split(/\s+/);

  const cities = [

    'delhi',
    'new delhi',
    'mumbai',
    'bangalore',
    'bengaluru',
    'chennai',
    'kolkata',
    'hyderabad',
    'pune',
    'mysore',
    'hoskote',
    'goa',
    'jaipur',
    'lucknow',
    'surat',
    'patna',
    'kochi',
    'noida',
    'gurgaon',
    'agra',
    'shimla',
    'manali'

  ];

  /* CHECK FULL MESSAGE */

  for(const city of cities){

    if(cleaned.includes(city)){
      return city;
    }

  }

  /* CHECK WORDS */

  for(const word of words){

    for(const city of cities){

      if(word === city){
        return city;
      }

    }

  }

  return null;
}

/* =========================
   FETCH WEATHER BY CITY
========================= */

async function getWeatherByCity(city){

  try{

    const apiKey =
      process.env.OPENWEATHER_API_KEY;

    const url =
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    const response =
      await axios.get(url);

    return response.data;

  }catch(err){

    console.log(
      'Weather fetch failed:',
      err.message
    );

    return null;
  }
}

/* =========================
   AI CHAT ROUTE
========================= */

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

    let liveWeather = weather;
    let liveCity = city;

    /* DETECT CITY */

    const detectedCity =
      extractCity(message);

    /* FETCH LIVE WEATHER */

    if(detectedCity){

      const cityWeather =
        await getWeatherByCity(
          detectedCity
        );

      if(cityWeather){

        liveWeather =
          cityWeather;

        liveCity =
          cityWeather.name;

      }

    }

    /* WEATHER TEXT */

    const weatherText = liveWeather
      ? `
Current Weather Data:

City: ${liveCity}

Temperature:
${liveWeather.main?.temp}°C

Feels Like:
${liveWeather.main?.feels_like}°C

Humidity:
${liveWeather.main?.humidity}%

Weather:
${liveWeather.weather?.[0]?.description}

Wind Speed:
${liveWeather.wind?.speed} m/s
`
      : 'No weather data available';

    /* AI */

    const completion =
      await groq.chat.completions.create({

        model: 'llama-3.1-8b-instant',

        messages: [

          {
            role: 'system',

            content: `
You are SkyCast AI.

You are an advanced live weather assistant.

You ALWAYS use weather data
provided by backend APIs.

You answer naturally like a human.

You can answer:

- weather
- rain chances
- travel advice
- bike ride safety
- humidity
- storms
- outdoor safety
- clothing suggestions
- heat alerts

Never say:
- "I don't have access"
- "check another website"
- "I cannot see weather"

Always answer using
available weather data.

Keep responses:
- short
- accurate
- friendly
- human-like
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
        max_tokens: 400,

      });

    const reply =
      completion
      .choices[0]
      .message.content;

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