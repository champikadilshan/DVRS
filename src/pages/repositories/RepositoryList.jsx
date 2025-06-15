import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader, RefreshCw, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import useAuthStore from '../../store/authStore';
import useRepositoryStore from '../../store/repositoryStore';
import { getECRRepositories } from '../../services/aws/ecr';

const RepositoryList = () => {
  const navigate = useNavigate();
  const { awsCredentials } = useAuthStore();
  const {
    repositories,
    loading,
    error,
    setRepositories,
    setLoading,
    setError,
  } = useRepositoryStore();
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchRepositories = async () => {
    setLoading(true);
    setError(null);

    try {
      const repos = await getECRRepositories(awsCredentials);
      setRepositories(repos);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (awsCredentials) {
      fetchRepositories();
    } else {
      navigate('/login');
    }
  }, [awsCredentials, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const getRepositoryUrl = (repository) => {
    return `https://${awsCredentials.accountId}.dkr.ecr.${awsCredentials.region}.amazonaws.com/${repository.repositoryName}`;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          ECR Repositories
        </h1>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-8">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && repositories.length === 0 && (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No repositories found in this region.</p>
        </div>
      )}

      {!loading && !error && repositories.length > 0 && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Repository Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {repositories.map((repo) => (
                <tr key={repo.repositoryArn} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {repo.repositoryName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {repo.imageCount} images
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(repo.lastUpdated)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {getRepositoryUrl(repo)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() =>
                        navigate(`/repositories/${repo.repositoryName}/analyze`)
                      }
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Analyze Repository
                    </button>
                    <button
                      onClick={() =>
                        navigate(`/repositories/${repo.repositoryName}`)
                      }
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View Details
                    </button>
                    <a
                      href={`https://${awsCredentials.region}.console.aws.amazon.com/ecr/repositories/${repo.repositoryName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-900 inline-flex items-center"
                    >
                      AWS Console
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RepositoryList;
