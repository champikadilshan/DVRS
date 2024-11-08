import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import useAuthStore from '../../store/authStore';
import { validateAWSCredentials } from '../../services/aws/auth';

const AWSAuthForm = () => {
  const navigate = useNavigate();
  const setCredentials = useAuthStore((state) => state.setCredentials);
  const [credentials, setLocalCredentials] = useState({
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const regions = [
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2',
    'eu-west-1',
    'eu-central-1',
    'ap-southeast-1',
    'ap-southeast-2',
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Validate AWS credentials
      const validationResult = await validateAWSCredentials(credentials);

      if (validationResult.success) {
        // Store credentials and account info in Zustand store
        setCredentials({
          ...credentials,
          accountId: validationResult.accountId,
          arn: validationResult.arn,
          userId: validationResult.userId,
        });

        setSuccess(true);

        // Add a small delay before redirecting
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (err) {
      setError(
        err.message ||
          'Failed to validate AWS credentials. Please check your inputs and try again.'
      );
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            AWS Access Key ID
          </label>
          <input
            type="text"
            name="accessKeyId"
            value={credentials.accessKeyId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            pattern="[A-Z0-9]{20}"
            title="AWS Access Key ID should be 20 characters long and contain only uppercase letters and numbers"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            AWS Secret Access Key
          </label>
          <input
            type="password"
            name="secretAccessKey"
            value={credentials.secretAccessKey}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            pattern="[A-Za-z0-9/+=]{40}"
            title="AWS Secret Access Key should be 40 characters long"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            AWS Region
          </label>
          <select
            name="region"
            value={credentials.region}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              <AlertCircle className="h-4 w-4" />
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 text-green-700 border-green-200">
            <AlertDescription>
              <CheckCircle className="h-4 w-4" />
              Successfully authenticated with AWS!
            </AlertDescription>
          </Alert>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
              Validating AWS Credentials...
            </div>
          ) : (
            'Authenticate'
          )}
        </button>
      </form>
    </div>
  );
};

export default AWSAuthForm;
