const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs').promises;
require('dotenv').config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function testVision() {
  try {
    console.log('Testing Claude Haiku with vision...\n');
    
    // Read the test image
    const imageBuffer = await fs.readFile('/tmp/test.png');
    const base64Image = imageBuffer.toString('base64');

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: 'Can you see this image? What questions do you see?'
          }
        ],
      }],
    });

    console.log('✅ VISION WORKS!');
    console.log('\nResponse:', message.content[0].text);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testVision();
