require('dotenv').config();
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

async function testBedrock() {
  try {
    console.log("Environment Check:");
    console.log("AWS_REGION:", process.env.AWS_REGION);
    console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID ? "✓ Set" : "✗ Missing");
    console.log("AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY ? "✓ Set" : "✗ Missing");
    console.log("-------------------------");

    if (!process.env.AWS_REGION) {
      throw new Error("AWS_REGION is not set in environment variables");
    }

    if (!process.env.AWS_ACCESS_KEY_ID) {
      throw new Error("AWS_ACCESS_KEY_ID is not set in environment variables");
    }

    if (!process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("AWS_SECRET_ACCESS_KEY is not set in environment variables");
    }

    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    });

    const input = {
      prompt: "\n\nHuman: Hello, can you hear me?\n\nAssistant:",
      max_tokens_to_sample: 100,
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

    console.log("\nSending request to Bedrock...");
    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    console.log("\nBedrock API Test Results:");
    console.log("-------------------------");
    console.log("Status: Success ✅");
    console.log("Model: anthropic.claude-v2");
    console.log("Response:", responseBody.completion);
    console.log("-------------------------");
  } catch (error) {
    console.error("\nBedrock API Test Results:");
    console.error("-------------------------");
    console.error("Status: Failed ❌");
    console.error("Error:", error.message);
    console.error("-------------------------");
    
    if (error.Code) {
      console.error("AWS Error Code:", error.Code);
    }
    if (error.$metadata) {
      console.error("HTTP Status Code:", error.$metadata.httpStatusCode);
    }
  }
}

testBedrock();
