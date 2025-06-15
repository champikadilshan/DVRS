// src/services/aws/auth.js
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { ECRClient, DescribeRepositoriesCommand } from '@aws-sdk/client-ecr';

export const validateAWSCredentials = async (credentials) => {
  try {
    // First, try to get caller identity using STS
    const stsClient = new STSClient({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    });

    // Try to get caller identity
    const identityCommand = new GetCallerIdentityCommand({});
    const identityResponse = await stsClient.send(identityCommand);

    // If we got here, credentials are valid. Now let's check ECR access
    const ecrClient = new ECRClient({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    });

    // Try to list ECR repositories to verify ECR access
    const ecrCommand = new DescribeRepositoriesCommand({
      maxResults: 1, // We only need to check access, not get all repositories
    });

    await ecrClient.send(ecrCommand);

    // If we got here, both STS and ECR access are valid
    return {
      success: true,
      accountId: identityResponse.Account,
      arn: identityResponse.Arn,
      userId: identityResponse.UserId,
    };
  } catch (error) {
    console.error('AWS Validation Error:', error);

    // Return specific error messages based on the error type
    if (
      error.name === 'InvalidClientTokenId' ||
      error.name === 'SignatureDoesNotMatch'
    ) {
      throw new Error(
        'Invalid AWS credentials. Please check your Access Key and Secret Key.'
      );
    } else if (error.name === 'AccessDeniedException') {
      throw new Error(
        "Your AWS credentials don't have sufficient permissions to access ECR."
      );
    } else if (error.name === 'ValidationException') {
      throw new Error('Invalid AWS region selected.');
    } else {
      throw new Error(`AWS Error: ${error.message}`);
    }
  }
};
