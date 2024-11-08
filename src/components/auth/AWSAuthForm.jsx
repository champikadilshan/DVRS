// src/components/auth/AWSAuthForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle,
  Loader,
  Key,
  Globe,
  Lock,
  Info,
  ChevronDown,
} from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import useAuthStore from '../../store/authStore';
import { validateAWSCredentials } from '../../services/aws/auth';

const AWSLogo = () => (
  <svg
    className="w-[120px] h-auto mx-auto mb-8"
    viewBox="0 0 304 182"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="#252F3E"
      d="M86.4 66.4c0 3.7.4 6.7 1.1 8.9.8 2.2 1.8 4.6 3.2 7.2.5.8.7 1.6.7 2.3 0 1-.6 2-1.9 3L83.2 92c-.9.6-1.8.9-2.6.9-1 0-2-.5-3-1.4-1.4-1.5-2.6-3.1-3.6-4.7-1-1.7-2-3.6-3.1-5.9-7.8 9.2-17.6 13.8-29.4 13.8-8.4 0-15.1-2.4-20-7.2-4.9-4.8-7.4-11.2-7.4-19.2 0-8.5 3-15.4 9.1-20.6 6.1-5.2 14.2-7.8 24.5-7.8 3.4 0 6.9.3 10.6.8 3.7.5 7.5 1.3 11.5 2.2v-7.3c0-7.6-1.6-12.9-4.7-16-3.2-3.1-8.6-4.6-16.3-4.6-3.5 0-7.1.4-10.8 1.3-3.7.9-7.3 2-10.8 3.4-1.6.7-2.8 1.1-3.5 1.3-.7.2-1.2.3-1.6.3-1.4 0-2.1-1-2.1-3.1v-4.9c0-1.6.2-2.8.7-3.5.5-.7 1.4-1.4 2.8-2.1 3.5-1.8 7.7-3.3 12.6-4.5C41 1.9 46.2 1.3 51.7 1.3c11.9 0 20.6 2.7 26.2 8.1 5.5 5.4 8.3 13.6 8.3 24.6v32.4zM45.8 81.6c3.3 0 6.7-.6 10.3-1.8 3.6-1.2 6.8-3.4 9.5-6.4 1.6-1.9 2.8-4 3.4-6.4.6-2.4 1-5.3 1-8.7v-4.2c-2.9-.7-6-1.3-9.2-1.7-3.2-.4-6.3-.6-9.4-.6-6.7 0-11.6 1.3-14.9 4-3.3 2.7-4.9 6.5-4.9 11.5 0 4.7 1.2 8.2 3.7 10.6 2.4 2.5 5.9 3.7 10.5 3.7zm80.3 10.8c-1.8 0-3-.3-3.8-1-.8-.6-1.5-2-2.1-3.9L96.7 10.2c-.6-2-.9-3.3-.9-4 0-1.6.8-2.5 2.4-2.5h9.8c1.9 0 3.2.3 3.9 1 .8.6 1.4 2 2 3.9l16.8 66.2 15.6-66.2c.5-2 1.1-3.3 1.9-3.9.8-.6 2.2-1 4-1h8c1.9 0 3.2.3 4 1 .8.6 1.5 2 1.9 3.9l15.8 67 17.3-67c.6-2 1.3-3.3 2-3.9.8-.6 2.1-1 3.9-1h9.3c1.6 0 2.5.8 2.5 2.5 0 .5-.1 1-.2 1.6-.1.6-.3 1.4-.7 2.5l-24.1 77.3c-.6 2-1.3 3.3-2.1 3.9-.8.6-2.1 1-3.8 1h-8.6c-1.9 0-3.2-.3-4-1-.8-.7-1.5-2-1.9-4L156 23l-15.4 64.4c-.5 2-1.1 3.3-1.9 4-.8.7-2.2 1-4 1h-8.6zm128.5 2.7c-5.2 0-10.4-.6-15.4-1.8-5-1.2-8.9-2.5-11.5-4-1.6-.9-2.7-1.9-3.1-2.8-.4-.9-.6-1.9-.6-2.8v-5.1c0-2.1.8-3.1 2.3-3.1.6 0 1.2.1 1.8.3.6.2 1.5.6 2.5 1 3.4 1.5 7.1 2.7 11 3.5 4 .8 7.9 1.2 11.9 1.2 6.3 0 11.2-1.1 14.6-3.3 3.4-2.2 5.2-5.4 5.2-9.5 0-2.8-.9-5.1-2.7-7-1.8-1.9-5.2-3.6-10.1-5.2L246 52c-7.3-2.3-12.7-5.7-16-10.2-3.3-4.4-5-9.3-5-14.5 0-4.2.9-7.9 2.7-11.1 1.8-3.2 4.2-6 7.2-8.2 3-2.3 6.4-4 10.4-5.2 4-1.2 8.2-1.7 12.6-1.7 2.2 0 4.5.1 6.7.4 2.3.3 4.4.7 6.5 1.1 2 .5 3.9 1 5.7 1.6 1.8.6 3.2 1.2 4.2 1.8 1.4.8 2.4 1.6 3 2.5.6.8.9 1.9.9 3.3v4.7c0 2.1-.8 3.2-2.3 3.2-.8 0-2.1-.4-3.8-1.2-5.7-2.6-12.1-3.9-19.2-3.9-5.7 0-10.2.9-13.3 2.8-3.1 1.9-4.7 4.8-4.7 8.9 0 2.8 1 5.2 3 7.1 2 1.9 5.7 3.8 11 5.5l14.2 4.5c7.2 2.3 12.4 5.5 15.5 9.6 3.1 4.1 4.6 8.8 4.6 14 0 4.3-.9 8.2-2.6 11.6-1.8 3.4-4.2 6.4-7.3 8.8-3.1 2.5-6.8 4.3-11.1 5.6-4.5 1.4-9.2 2.1-14.3 2.1z"
    />
    <g fill="#FF9900" fillRule="evenodd">
      <path d="M273.5 143.7c-32.9 24.3-80.7 37.2-121.8 37.2-57.6 0-109.5-21.3-148.7-56.7-3.1-2.8-.3-6.6 3.4-4.4 42.4 24.6 94.7 39.5 148.8 39.5 36.5 0 76.6-7.6 113.5-23.2 5.5-2.5 10.2 3.6 4.8 7.6" />
      <path d="M287.2 128.1c-4.2-5.4-27.8-2.6-38.5-1.3-3.2.4-3.7-2.4-.8-4.5 18.8-13.2 49.7-9.4 53.3-5 3.6 4.5-1 35.4-18.6 50.2-2.7 2.3-5.3 1.1-4.1-1.9 4-9.9 12.9-32.2 8.7-37.5" />
    </g>
  </svg>
);

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
  const [showHelp, setShowHelp] = useState(false);

  const regions = [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-east-2', label: 'US East (Ohio)' },
    { value: 'us-west-1', label: 'US West (N. California)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'eu-west-1', label: 'Europe (Ireland)' },
    { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
    { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
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
      const validationResult = await validateAWSCredentials(credentials);

      if (validationResult.success) {
        setCredentials({
          ...credentials,
          accountId: validationResult.accountId,
          arn: validationResult.arn,
          userId: validationResult.userId,
        });

        setSuccess(true);
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
    <div className="min-h-screen bg-[#fbfbfd] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-[420px]">
        <div className="text-center">
          <AWSLogo />
          <h2
            className="text-[32px] leading-tight font-medium text-gray-900"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            Sign in to AWS
          </h2>
          <p
            className="mt-3 text-base text-gray-500"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            Enter your credentials to continue
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[420px]">
        <div className="bg-white/70 backdrop-blur-xl py-8 px-6 shadow-2xl sm:rounded-2xl sm:px-8 border border-gray-100/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Key className="w-4 h-4 mr-2 text-gray-400" />
                      Access Key ID
                    </div>
                    {!showHelp && (
                      <button
                        type="button"
                        onClick={() => setShowHelp(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Need help?
                      </button>
                    )}
                  </div>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="accessKeyId"
                    value={credentials.accessKeyId}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 text-base border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    style={{
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, sans-serif',
                    }}
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    required
                    pattern="[A-Z0-9]{20}"
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                  }}
                >
                  <div className="flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-gray-400" />
                    Secret Access Key
                  </div>
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    name="secretAccessKey"
                    value={credentials.secretAccessKey}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 text-base border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    style={{
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, sans-serif',
                    }}
                    placeholder="Your AWS secret access key"
                    required
                    pattern="[A-Za-z0-9/+=]{40}"
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                  }}
                >
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-2 text-gray-400" />
                    Region
                  </div>
                </label>
                <div className="mt-1 relative">
                  <select
                    name="region"
                    value={credentials.region}
                    onChange={handleInputChange}
                    className="appearance-none block w-full px-4 py-3 text-base border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    style={{
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, sans-serif',
                    }}
                  >
                    {regions.map((region) => (
                      <option key={region.value} value={region.value}>
                        {region.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {showHelp && (
              <div className="rounded-xl bg-blue-50/50 backdrop-blur-sm p-4 border border-blue-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3
                      className="text-sm font-medium text-blue-800"
                      style={{
                        fontFamily:
                          '-apple-system, BlinkMacSystemFont, sans-serif',
                      }}
                    >
                      Finding your credentials
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ol
                        className="list-decimal pl-5 space-y-1"
                        style={{
                          fontFamily:
                            '-apple-system,BlinkMacSystemFont, sans-serif',
                        }}
                      >
                        <li>Sign in to the AWS Management Console</li>
                        <li>Click your username at the top right</li>
                        <li>Select "Security credentials"</li>
                        <li>
                          Under "Access keys", create or use an existing key
                        </li>
                      </ol>
                      <button
                        type="button"
                        onClick={() => setShowHelp(false)}
                        className="mt-3 text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Close help
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <Alert
                variant="destructive"
                className="rounded-xl border-red-200 bg-red-50"
              >
                <AlertDescription
                  className="flex items-center text-red-800"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                  }}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="rounded-xl bg-green-50 border-green-200">
                <AlertDescription
                  className="flex items-center text-green-800"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Successfully authenticated with AWS
                </AlertDescription>
              </Alert>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                }}
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Authenticating...
                  </div>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="relative flex justify-center text-sm">
                <span
                  className="px-2 bg-transparent text-gray-500"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                  }}
                >
                  Need AWS credentials?{' '}
                  <a
                    href="https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Learn more
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AWSAuthForm;
