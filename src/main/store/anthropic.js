const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
require('dotenv').config();

// Initialize the Bedrock client as a singleton
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

class Messages {
  async create(params) {
    try {
      console.log('Creating message with params:', JSON.stringify(params, null, 2));

      const prompt = params.messages.map(msg => {
        if (typeof msg.content === 'string') {
          return `${msg.role === 'assistant' ? 'Assistant' : 'Human'}: ${msg.content}`;
        }
        return `${msg.role === 'assistant' ? 'Assistant' : 'Human'}: ${JSON.stringify(msg.content)}`;
      }).join('\n\n');

      const systemPrompt = params.system ? `\n\nSystem: ${params.system}` : '';
      
      const input = {
        prompt: `${systemPrompt}\n\nHuman: ${prompt}\n\nAssistant:`,
        max_tokens_to_sample: params.max_tokens || 2048,
        temperature: 0.7,
        top_k: 250,
        top_p: 1,
        stop_sequences: ["\n\nHuman:"],
        anthropic_version: "bedrock-2023-05-31"
      };

      console.log('Sending request to Bedrock with input:', JSON.stringify(input, null, 2));

      const command = new InvokeModelCommand({
        modelId: "anthropic.claude-v2",
        body: JSON.stringify(input),
        contentType: "application/json",
        accept: "application/json",
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      console.log('Received response from Bedrock:', JSON.stringify(responseBody, null, 2));

      return {
        id: 'msg_' + Date.now(),
        content: [{
          type: 'text',
          text: responseBody.completion.trim()
        }],
        model: params.model || "anthropic.claude-v2",
        role: "assistant",
        usage: {
          input_tokens: input.prompt.length,
          output_tokens: responseBody.completion.length
        }
      };
    } catch (error) {
      console.error('Bedrock API Error:', error);
      throw error;
    }
  }
}

// Export the client with the beta namespace to match the expected structure
const anthropic = {
  beta: {
    messages: new Messages()
  }
};

module.exports = { anthropic };
