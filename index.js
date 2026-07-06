import Anthropic from "@anthropic-ai/sdk";

import dotenv from "dotenv";

dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});


const msg = await client.messages.create({
  model: "claude-opus-4-7",
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: "Hello, Claude",
    },
  ],
});

console.log(msg.content[0].text);
