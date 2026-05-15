"use strict";

var Groq = require("groq-sdk");

var groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

function askSkyCastAI(weatherData, userQuestion) {
  var prompt, completion;
  return regeneratorRuntime.async(function askSkyCastAI$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          prompt = "\nYou are SkyCast AI.\n\nYou are a smart weather assistant and helpful AI chatbot.\n\nCurrent Weather Data:\n".concat(JSON.stringify(weatherData), "\n\nUser Question:\n").concat(userQuestion, "\n\nRules:\n- Answer naturally\n- Explain weather simply\n- Give useful suggestions\n- Mention alerts if needed\n- If user asks non-weather questions, answer normally\n- Keep replies short and human-friendly\n");
          _context.next = 3;
          return regeneratorRuntime.awrap(groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{
              role: "user",
              content: prompt
            }],
            temperature: 0.7
          }));

        case 3:
          completion = _context.sent;
          return _context.abrupt("return", completion.choices[0].message.content);

        case 5:
        case "end":
          return _context.stop();
      }
    }
  });
}

module.exports = {
  askSkyCastAI: askSkyCastAI
};