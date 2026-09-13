import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const zai = await ZAI.create();
const img = fs.readFileSync('/home/z/my-project/tool-results/verify-pricing.png').toString('base64');
const res = await zai.chat.completions.createVision({
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe this webpage screenshot in detail: layout, colors, typography, any visual defects (broken images, overlapping text, misaligned elements, unstyled content). Be specific and critical.' },
        { type: 'image_url', image_url: { url: `data:image/png;base64,${img}` } }
      ]
    }
  ]
});
console.log(res.choices[0].message.content);
