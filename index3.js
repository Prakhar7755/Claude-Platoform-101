import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const prompt = "Why to even use rabbitmq when kafka can do the job ?";

const models = ["claude-haiku-4-5", "claude-sonnet-4-6", "claude-opus-4-7"];

async function testModels() {
  for (const model of models) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      console.log(model, response.usage);
    } catch (error) {
      console.error(`${model} failed:`, error.message);
    }
  }
}

testModels();
