import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const tools = [
  {
    name: "get_weather",
    description: "Get today's current weather for a city.",
    input_schema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "The city to check",
        },
      },
      required: ["city"],
    },
  },
  {
    name: "get_forecast",
    description: "Get the weather forecast for the next few days for a city.",
    input_schema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "The city to check",
        },
      },
      required: ["city"],
    },
  },
];

async function getWeather(city) {
  return `Today's weather in ${city}: 22°C, Sunny`;
}

async function getForecast(city) {
  return `Forecast for ${city}: Tomorrow 24°C, Day after 20°C`;
}

async function runTool(name, input) {
  switch (name) {
    case "get_weather":
      return await getWeather(input.city);

    case "get_forecast":
      return await getForecast(input.city);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function main() {
  const messages = [
    {
      role: "user",
      content:
        "I'm packing for a three-day trip to Denver. What's the weather today and the forecast?",
    },
  ];

  while (true) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages,
      tools,
    });

    if (response.stop_reason !== "tool_use") {
      console.log(
        response.content
          .filter((block) => block.type === "text")
          .map((block) => block.text)
          .join("\n")
      );
      break;
    }

    messages.push({
      role: "assistant",
      content: response.content,
    });

    const toolResults = [];

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      const result = await runTool(block.name, block.input);

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: result,
      });
    }

    messages.push({
      role: "user",
      content: toolResults,
    });
  }
}

main().catch(console.error);