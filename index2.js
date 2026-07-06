import Anthropic from "@anthropic-ai/sdk";

import dotenv from "dotenv";

dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const buggyCode = `
function add(a, b) {
  return a - b;
}
`;

const response = client.messages.create({
  model: "claude-opus-4-8",
  max_tokens: 1024,
  system:
    "You are a terse senior code reviewer. Give feedback in one paragraph.",
  messages: [{ role: "user", content: `Review this code:\n${buggyCode}` }],
});

for (const block of response.content) {
  if (block.type === "text") {
    console.log(block.text);
  }
}
