import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const skill = await client.beta.skills.create({
  display_title: "My Skill",
  files: filesFromDir("./skill-folder"),
});

const skillId = skill.id; 

// pretend this is your uploaded skill id
// const skillId = "skill_123456";

const activityLog = `
- Built login API
- Fixed dashboard crash
- Started payment integration
- Waiting for Stripe credentials
`;

const response = await client.beta.messages.create({
  model: "claude-sonnet-4-5",
  max_tokens: 4096,

  betas: ["skills-2025-10-02"],

  container: {
    skills: [
      {
        type: "custom",
        skill_id: skillId,
        version: "latest",
      },
    ],
  },

  messages: [
    {
      role: "user",
      content: `Generate a status report from this log:\n\n${activityLog}`,
    },
  ],
});

console.log(
  response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n"),
);
