import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
dotenv.config();

const apiKey = (globalThis as any).process?.env?.ANTHROPIC_API_KEY;
const client = new Anthropic({
  apiKey: apiKey!,
});

async function main() {
  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 16000,

    // Enable adaptive thinking
    thinking: {
      type: "adaptive",
    },

    // Control reasoning depth
    output_config: {
      effort: "high", // low | medium | high | xhigh | max
    },

    messages: [
      {
        role: "user",
        content:
          "Plan a road trip out of San Francisco with two stops, weighing weather and drive time.",
      },
    ],
  });

  // Print all content blocks (thinking + text)
  for (const block of response.content) {
    switch (block.type) {
      case "thinking":
        console.log("\n=== THINKING ===\n");
        console.log(block.thinking);
        break;

      case "text":
        console.log("\n=== FINAL ANSWER ===\n");
        console.log(block.text);
        break;
    }
  }
}

main().catch(console.error);
