import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Get today's current weather for a city.
 */
async function getWeather(city) {
  return `Today's weather in ${city}: 22°C, Sunny`;
}

/**
 * Get the weather forecast for the next few days for a city.
 */
async function getForecast(city) {
  return `Forecast for ${city}: Tomorrow 24°C, Day after 20°C`;
}

async function main() {
  const runner = client.beta.messages.toolRunner({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content:
          "I'm packing for a three-day trip to Denver. What's the weather today and over the next few days?",
      },
    ],
    tools: [getWeather, getForecast],
  });

  const finalMessage = await runner.untilDone();

  console.log(
    finalMessage.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n"),
  );
}

main().catch(console.error);
