const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function askSkyCastAI(weatherData, userQuestion) {

  const prompt = `
You are SkyCast AI.

You are a smart weather assistant and helpful AI chatbot.

Current Weather Data:
${JSON.stringify(weatherData)}

User Question:
${userQuestion}

Rules:
- Answer naturally
- Explain weather simply
- Give useful suggestions
- Mention alerts if needed
- If user asks non-weather questions, answer normally
- Keep replies short and human-friendly
`;

  const completion =
    await groq.chat.completions.create({

      model: "llama-3.3-70b-versatile",

      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],

      temperature: 0.7,
    });

  return completion.choices[0].message.content;
}

module.exports = {
  askSkyCastAI,
};