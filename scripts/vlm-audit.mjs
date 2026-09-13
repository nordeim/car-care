// Flexible VLM audit: node vlm-audit.mjs <promptfile-or-inline> <img1> [img2] [...]
// Usage: node vlm-audit.mjs "prompt text" /path/img1.png [/path/img2.png ...]
// If first arg is a path to an existing file, its content is used as the prompt.
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node vlm-audit.mjs "<prompt>" <img1> [img2 ...]');
  process.exit(1);
}

let prompt = args[0];
if (fs.existsSync(prompt) && prompt.endsWith('.txt')) {
  prompt = fs.readFileSync(prompt, 'utf8');
}

const zai = await ZAI.create();
const content = [
  { type: 'text', text: prompt },
  ...args.slice(1).map((p) => ({
    type: 'image_url',
    image_url: { url: `data:image/png;base64,${fs.readFileSync(p).toString('base64')}` },
  })),
];

const res = await zai.chat.completions.createVision({
  messages: [{ role: 'user', content }],
});
console.log(res.choices[0].message.content);
