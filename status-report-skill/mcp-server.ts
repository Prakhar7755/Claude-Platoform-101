import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
dotenv.config();

const apiKey = (globalThis as any).process?.env?.ANTHROPIC_API_KEY;
const client = new Anthropic({
  apiKey: apiKey!,
});

const response = await client.beta.messages.create({
  model: "claude-opus-4-8",
  max_tokens: 1000,

  messages: [
    {
      role: "user",
      content: "What tools do you have available?",
    },
  ],

  // 🔌 MCP servers
  mcp_servers: [
    {
      type: "url",
      url: "https://mcp.linear.app/mcp",
      name: "linear",
      authorization_token: process.env.LINEAR_MCP_TOKEN!,
    },
  ],

  // 🧰 expose MCP toolset
  tools: [
    {
      type: "mcp_toolset",
      mcp_server_name: "linear",
    },
  ],

  betas: ["mcp-client-2025-11-20"],
});

console.log(response.content);

for (const block of response.content) {
  switch (block.type) {
    case "mcp_tool_use":
      console.log("TOOL:", block.name);
      console.log("SERVER:", block.server_name);
      console.log("INPUT:", block.input);
      break;

    case "mcp_tool_result":
      console.log("RESULT:", block.content);
      break;

    case "text":
      console.log("TEXT:", block.text);
      break;
  }
}
