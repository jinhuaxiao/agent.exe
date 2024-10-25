import { BedrockRuntimeClientConfig } from '@aws-sdk/client-bedrock-runtime';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';

export const getBedrockConfig = async (): Promise<BedrockRuntimeClientConfig> => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials not configured');
  }

  const baseConfig = {
    region: process.env.AWS_REGION || 'us-west-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  };

  // If role ARN is provided, assume the role
  if (process.env.BEDROCK_ASSUME_ROLE_ARN) {
    try {
      const sts = new STSClient(baseConfig);
      const command = new AssumeRoleCommand({
        RoleArn: process.env.BEDROCK_ASSUME_ROLE_ARN,
        RoleSessionName: 'BedrockSession'
      });

      const response = await sts.send(command);
      
      if (response.Credentials) {
        return {
          ...baseConfig,
          credentials: {
            accessKeyId: response.Credentials.AccessKeyId!,
            secretAccessKey: response.Credentials.SecretAccessKey!,
            sessionToken: response.Credentials.SessionToken
          }
        };
      }
    } catch (error) {
      console.error('Error assuming role:', error);
      throw error;
    }
  }

  return baseConfig;
};
