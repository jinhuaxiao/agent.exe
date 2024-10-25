import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import dotenv from 'dotenv';

dotenv.config();

interface Message {
  role: string;
  content: string | Array<{
    type: string;
    text?: string;
    source?: {
      type: string;
      media_type: string;
      data: string;
    };
  }>;
}

interface CreateMessageParams {
  model: string;
  max_tokens: number;
  messages: Message[];
  tools?: Array<any>;
  system?: string;
  betas?: string[];
}

interface MessageResponse {
  id: string;
  content: Array<{
    type: string;
    text?: string;
    tool_use?: {
      id: string;
      name: string;
      input: any;
    };
  }>;
  model: string;
  role: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// Initialize the Bedrock client as a singleton
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

class Messages {
  private cleanJsonString(jsonStr: string): string {
    console.log('Original JSON:', jsonStr);
    
    // First, normalize all whitespace and line endings
    let cleaned = jsonStr.replace(/\s+/g, ' ').trim();
    
    // Add missing commas between properties
    cleaned = cleaned.replace(/(["}])\s*"([^"]+)":/g, '$1, "$2":');
    
    // Add missing commas between array elements
    cleaned = cleaned.replace(/([0-9])\s+([0-9])/g, '$1, $2');
    
    // Fix any double commas that might have been created
    cleaned = cleaned.replace(/,\s*,/g, ',');
    
    // Remove any trailing commas before closing braces/brackets
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
    
    console.log('Cleaned JSON:', cleaned);
    return cleaned;
  }

  private parseToolUse(jsonStr: string): any {
    try {
      const cleaned = this.cleanJsonString(jsonStr);
      const parsed = JSON.parse(cleaned);
      console.log('Successfully parsed JSON:', parsed);
      return parsed;
    } catch (e) {
      console.error('Error parsing JSON:', e);
      console.error('Failed JSON string:', jsonStr);
      return null;
    }
  }

  async create(params: CreateMessageParams): Promise<MessageResponse> {
    try {
      const prompt = params.messages.map(msg => {
        if (typeof msg.content === 'string') {
          return `${msg.role === 'assistant' ? 'Assistant' : 'Human'}: ${msg.content}`;
        }
        return `${msg.role === 'assistant' ? 'Assistant' : 'Human'}: ${JSON.stringify(msg.content)}`;
      }).join('\n\n');

      const systemPrompt = params.system ? `\n\nSystem: ${params.system}` : '';
      const toolsPrompt = params.tools ? `\n\nTools available: ${JSON.stringify(params.tools)}` : '';
      
      const input = {
        prompt: `${systemPrompt}${toolsPrompt}\n\nHuman: ${prompt}\n\nAssistant:`,
        max_tokens_to_sample: params.max_tokens || 2048,
        temperature: 0.7,
        top_k: 250,
        top_p: 1,
        stop_sequences: ["\n\nHuman:"],
        anthropic_version: "bedrock-2023-05-31"
      };

      const command = new InvokeModelCommand({
        modelId: "anthropic.claude-v2",
        body: JSON.stringify(input),
        contentType: "application/json",
        accept: "application/json",
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const completion = responseBody.completion.trim();
      
      console.log('Raw completion:', completion);
      
      // Try to parse all JSON objects in the completion
      const content: Array<any> = [];
      const jsonRegex = /\{[\s\S]*?\}/g;
      let match;
      let lastIndex = 0;

      while ((match = jsonRegex.exec(completion)) !== null) {
        const toolUseObj = this.parseToolUse(match[0]);
        if (toolUseObj && toolUseObj.name === 'computer' && toolUseObj.input) {
          // Add any text before this JSON as a text content
          const textBefore = completion.substring(lastIndex, match.index).trim();
          if (textBefore) {
            content.push({ type: 'text', text: textBefore });
          }

          content.push({
            type: 'tool_use',
            tool_use: {
              id: 'tool_' + Date.now() + '_' + content.length,
              name: 'computer',
              input: {
                action: toolUseObj.input.action,
                coordinate: toolUseObj.input.coordinate,
              }
            }
          });

          lastIndex = match.index + match[0].length;
        }
      }

      // Add any remaining text after the last JSON
      const textAfter = completion.substring(lastIndex).trim();
      if (textAfter) {
        content.push({ type: 'text', text: textAfter });
      }

      // If no content was parsed, return the whole thing as text
      if (content.length === 0) {
        content.push({
          type: 'text',
          text: completion
        });
      }

      console.log('Final content array:', JSON.stringify(content, null, 2));

      return {
        id: 'msg_' + Date.now(),
        content,
        model: params.model || "anthropic.claude-v2",
        role: "assistant",
        usage: {
          input_tokens: input.prompt.length,
          output_tokens: completion.length
        }
      };
    } catch (error) {
      console.error('Bedrock API Error:', error);
      throw error;
    }
  }
}

// Export the client with the beta namespace to match the expected structure
export const anthropic = {
  beta: {
    messages: new Messages()
  }
};

// For debugging purposes
(global as any).anthropicClient = anthropic;
