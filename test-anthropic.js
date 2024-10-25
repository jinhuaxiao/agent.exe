require('dotenv').config();
const { anthropic } = require('./src/main/store/anthropic.js');

async function testAnthropicStructure() {
  try {
    console.log('\nEnvironment Check:');
    console.log('-------------------------');
    console.log('AWS_REGION:', process.env.AWS_REGION);
    console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✓ Set' : '✗ Missing');
    console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Missing');
    console.log('-------------------------');

    console.log('\nAnthropicClient Structure:');
    console.log('-------------------------');
    console.log('beta exists:', !!anthropic.beta);
    console.log('messages exists:', !!anthropic.beta?.messages);
    console.log('create exists:', typeof anthropic.beta?.messages?.create);
    console.log('-------------------------');

    console.log('\nTesting API Call with Tool Use...');
    const response = await anthropic.beta.messages.create({
      model: 'anthropic.claude-v2',
      max_tokens: 1024,
      messages: [{ 
        role: 'user', 
        content: 'Move the mouse to coordinates (100, 100) and click.' 
      }],
      tools: [{
        type: 'function',
        name: 'computer',
        description: 'Control computer actions like mouse movements and clicks',
        parameters: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              description: 'The action to perform',
              enum: ['mouse_move', 'left_click']
            },
            coordinate: {
              type: 'array',
              description: 'Array of [x, y] coordinates for mouse movement',
              items: {
                type: 'number'
              },
              minItems: 2,
              maxItems: 2
            }
          },
          required: ['action']
        }
      }],
      system: `You are a computer control assistant that uses the provided 'computer' tool to perform actions.
IMPORTANT: 
- Do not provide code or explanations
- Use the computer tool directly with the exact format:
{
  "name": "computer",
  "input": {
    "action": "mouse_move",
    "coordinate": [x, y]
  }
}
OR
{
  "name": "computer",
  "input": {
    "action": "left_click"
  }
}

For mouse movements and clicks:
1. First call with action: "mouse_move" and coordinate: [x, y]
2. Then call with action: "left_click"`,
    });

    console.log('\nAPI Response:');
    console.log('-------------------------');
    console.log(JSON.stringify(response, null, 2));
    console.log('-------------------------');

    // Test parsing of tool use response
    if (response.content.some(c => c.type === 'tool_use')) {
      console.log('\nTool use detected in response ✓');
      const toolUse = response.content.find(c => c.type === 'tool_use');
      console.log('Tool details:', toolUse?.tool_use);
    } else {
      console.log('\nNo tool use detected in response ✗');
    }
  } catch (error) {
    console.error('\nError occurred:');
    console.error('-------------------------');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('-------------------------');
  }
}

testAnthropicStructure().catch(console.error);
