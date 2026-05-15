"use strict";

var express = require('express');

var axios = require('axios');

var router = express.Router();

var _require = require('../services/ai.service'),
    askSkyCastAI = _require.askSkyCastAI;

router.post('/chat', function _callee(req, res) {
  var _req$body, city, question, weatherRes, weather, cleanWeather, reply;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _req$body = req.body, city = _req$body.city, question = _req$body.question;

          if (!(!city || !question)) {
            _context.next = 4;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            error: 'City and question required'
          }));

        case 4:
          _context.next = 6;
          return regeneratorRuntime.awrap(axios.get("https://api.openweathermap.org/data/2.5/weather?q=".concat(city, "&appid=").concat(process.env.OPENWEATHER_API_KEY, "&units=metric")));

        case 6:
          weatherRes = _context.sent;
          weather = weatherRes.data; // CLEAN WEATHER DATA

          cleanWeather = {
            city: weather.name,
            temperature: weather.main.temp,
            feelsLike: weather.main.feels_like,
            humidity: weather.main.humidity,
            pressure: weather.main.pressure,
            condition: weather.weather[0].main,
            description: weather.weather[0].description,
            windSpeed: weather.wind.speed,
            visibility: weather.visibility
          }; // AI RESPONSE

          _context.next = 11;
          return regeneratorRuntime.awrap(askSkyCastAI(cleanWeather, question));

        case 11:
          reply = _context.sent;
          res.json({
            success: true,
            weather: cleanWeather,
            reply: reply
          });
          _context.next = 19;
          break;

        case 15:
          _context.prev = 15;
          _context.t0 = _context["catch"](0);
          console.error(_context.t0);
          res.status(500).json({
            error: 'AI chat failed'
          });

        case 19:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 15]]);
});
module.exports = router;