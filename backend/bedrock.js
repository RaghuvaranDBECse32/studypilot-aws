import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

/**
 * Generate study content from student notes using Amazon Bedrock.
 * @param {string} notes - Raw lecture notes
 * @param {string} goal - One of: "Revise today", "Make quiz", "Explain simply"
 * @returns {Promise<string>} Generated study material
 */
export async function generateStudyContent(notes, goal) {
  const prompts = {
    "Revise today": `
You are StudyPilot, an Alexa-style AI study assistant.

Student goal: Revise today

Using ONLY the notes below, produce:

1. **5-Point Revision Summary** — five concise bullet points covering the core ideas.
2. **90-Minute Study Plan** — a timed plan with clear time blocks (e.g. 0–20 min, 20–45 min…).
3. **Quick Self-Check** — 5 short quiz questions (without answers) so the student can test themselves.

Keep the tone encouraging, clear, and focused. Do not invent facts beyond the notes.

Notes:
${notes}
`,
    "Make quiz": `
You are StudyPilot, an Alexa-style AI study assistant.

Student goal: Make quiz

Using ONLY the notes below, create:

**5 Practice Questions with Answers**

For each question:
- Write a clear question that tests understanding of the notes.
- Provide the correct answer right after it.
- Cover different parts of the notes (definitions, processes, comparisons, conditions, etc.).

Format:
1. Question…
   Answer: …

Keep answers accurate and derived only from the provided notes.

Notes:
${notes}
`,
    "Explain simply": `
You are StudyPilot, an Alexa-style AI study assistant.

Student goal: Explain simply

Using ONLY the notes below:

1. Identify the single hardest / most complex concept in the notes.
2. Explain that concept in simple, everyday language (as if teaching a beginner).
3. Give one short analogy if it helps.
4. List 2–3 key takeaways the student should remember.

Do not add external knowledge. Stay grounded in the notes.

Notes:
${notes}
`,
  };

  const prompt = prompts[goal] || prompts["Revise today"];

  // Anthropic Claude on Bedrock (adjust model ID as needed)
  const modelId =
    process.env.BEDROCK_MODEL_ID ||
    "anthropic.claude-3-haiku-20240307-v1:0";

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1200,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }],
        },
      ],
    }),
  });

  const response = await client.send(command);
  const decoded = new TextDecoder().decode(response.body);
  const parsed = JSON.parse(decoded);

  // Claude response shape
  if (parsed.content && parsed.content[0] && parsed.content[0].text) {
    return parsed.content[0].text;
  }

  // Fallback for other response shapes
  return JSON.stringify(parsed, null, 2);
}
