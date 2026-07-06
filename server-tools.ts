import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
dotenv.config();

const apiKey = (globalThis as any).process?.env?.ANTHROPIC_API_KEY;
const client = new Anthropic({
  apiKey: apiKey!,
});

async function main() {
  // 1. Web Search (server tool)
  const searchResponse = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    tools: [{ type: "web_search_20260209", name: "web_search" }],
    messages: [
      {
        role: "user",
        content:
          "What is Anthropic's latest model release? Answer in one sentence.",
      },
    ],
  });

  console.log("\n=== WEB SEARCH ===\n");

  for (const block of searchResponse.content) {
    switch (block.type) {
      case "server_tool_use":
        console.log("Tool:", block.name);
        console.log("Input:", block.input);
        break;

      case "text":
        console.log(block.text);
        break;
    }
  }

  // 2. Code Execution (server tool)

  const codeResponse = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    tools: [{ type: "code_execution_20260120", name: "code_execution" }],
    messages: [
      {
        role: "user",
        content:
          "Calculate the mean and standard deviation of [1,2,3,4,5,6,7,8,9,10]",
      },
    ],
  });

  console.log("\n=== CODE EXECUTION ===\n");

  for (const block of codeResponse.content) {
    switch (block.type) {
      case "server_tool_use":
        console.log("Tool:", block.name);
        console.log("Input:", block.input);
        break;

      case "bash_code_execution_tool_result":
        console.log("stdout:");
        if (block.content && "stdout" in block.content) {
          console.log(block.content.stdout);
        } else {
          console.log("No stdout available.");
        }
        break;

      case "text":
        console.log(block.text);
        break;
    }
  }
}

main().catch(console.error);
