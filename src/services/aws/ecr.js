// src/services/aws/ecr.js
import {
  ECRClient,
  DescribeRepositoriesCommand,
  ListImagesCommand,
} from '@aws-sdk/client-ecr';

export const getECRRepositories = async (credentials) => {
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
        const imagesCommand = new ListImagesCommand({
          repositoryName: repo.repositoryName,
        });
        const imagesResponse = await ecrClient.send(imagesCommand);

        return {
          ...repo,
          imageCount: imagesResponse.imageIds?.length || 0,
          lastUpdated: repo.lastPushTimestamp,
        };
      })
    );

    return repositoriesWithImages;
  } catch (error) {
    console.error('ECR Error:', error);
    throw new Error(`Failed to fetch ECR repositories: ${error.message}`);
  }
};
