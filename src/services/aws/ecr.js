// src/services/aws/ecr.js
import {
  ECRClient,
  DescribeRepositoriesCommand,
  ListImagesCommand,
} from '@aws-sdk/client-ecr';

export const getECRRepositories = async (credentials) => {
  if (
    !credentials?.accessKeyId ||
    !credentials?.secretAccessKey ||
    !credentials?.region
  ) {
    throw new Error('Invalid AWS credentials configuration');
  }

  const ecrClient = new ECRClient({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
  });

  try {
    const command = new DescribeRepositoriesCommand({});
    const response = await ecrClient.send(command);

    // Get image counts for each repository
    const repositoriesWithImages = await Promise.all(
      response.repositories.map(async (repo) => {
        try {
          const imagesCommand = new ListImagesCommand({
            repositoryName: repo.repositoryName,
          });
          const imagesResponse = await ecrClient.send(imagesCommand);

          return {
            ...repo,
            imageCount: imagesResponse.imageIds?.length || 0,
            lastUpdated: repo.lastPushTimestamp,
          };
        } catch (error) {
          console.error(
            `Error fetching images for repository ${repo.repositoryName}:`,
            error
          );
          return {
            ...repo,
            imageCount: 0,
            lastUpdated: repo.lastPushTimestamp,
            error: error.message,
          };
        }
      })
    );

    return repositoriesWithImages;
  } catch (error) {
    console.error('ECR Error:', error);
    if (error.$metadata?.httpStatusCode === 400) {
      throw new Error(
        'Invalid request to AWS ECR. Please check your credentials and permissions.'
      );
    }
    throw new Error(`Failed to fetch ECR repositories: ${error.message}`);
  }
};
