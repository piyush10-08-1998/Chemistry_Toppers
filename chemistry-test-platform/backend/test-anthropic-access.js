const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function testModels() {
  const modelsToTest = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620', 
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'claude-2.1',
    'claude-2.0',
    'claude-instant-1.2'
  ];

  console.log('Testing Anthropic API access...\n');

  for (const model of modelsToTest) {
    try {
      const message = await anthropic.messages.create({
        model: model,
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: 'Hi'
        }]
      });
      console.log(`✅ ${model} - WORKS`);
    } catch (error) {
      if (error.status === 404) {
        console.log(`❌ ${model} - NOT FOUND (404)`);
      } else if (error.status === 403) {
        console.log(`❌ ${model} - FORBIDDEN (403) - No permission`);
      } else {
        console.log(`❌ ${model} - ERROR: ${error.message}`);
      }
    }
  }
}

testModels();
