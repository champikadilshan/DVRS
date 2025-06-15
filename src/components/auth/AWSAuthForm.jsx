import { useState, useEffect, useCallback } from 'react';
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
  ArrowRight,
  Shield,
  ChartBar,
  Eye,
  Bell,
  Clock,
  RefreshCw,
  Search,
  Database,
  CloudOff,
  Zap,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import useAuthStore from '../../store/authStore';
import { validateAWSCredentials } from '../../services/aws/auth';

// Feature data array
const FEATURES = [
  {
    icon: Shield,
    title: 'Advanced Security',
    description: 'Continuous vulnerability scanning and threat detection',
    bgColor: 'bg-blue-700',
  },
  {
    icon: ChartBar,
    title: 'Real-time Monitoring',
    description: 'Track and analyze container security in real-time',
    bgColor: 'bg-blue-700',
  },
  {
    icon: Eye,
    title: 'Proactive Detection',
    description: 'Identify vulnerabilities before they become threats',
    bgColor: 'bg-blue-700',
  },
  {
    icon: Bell,
    title: 'Instant Alerts',
    description: 'Get notified immediately about security concerns',
    bgColor: 'bg-blue-700',
  },
  {
    icon: Clock,
    title: 'Continuous Scanning',
    description: '24/7 automated security assessment and monitoring',
    bgColor: 'bg-blue-700',
  },
  {
    icon: RefreshCw,
    title: 'Auto Remediation',
    description: 'Automated fix suggestions and patch management',
    bgColor: 'bg-blue-700',
  },
  {
    icon: Search,
    title: 'Deep Analysis',
    description: 'In-depth scanning of container layers and dependencies',
    bgColor: 'bg-blue-700',
  },
  {
    icon: Database,
    title: 'Compliance Ready',
    description: 'Meet security standards and compliance requirements',
    bgColor: 'bg-blue-700',
  },
  {
    icon: CloudOff,
    title: 'Offline Support',
    description: 'Scan containers in air-gapped environments',
    bgColor: 'bg-blue-700',
  },
];

const FeatureCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const totalSets = Math.ceil(FEATURES.length / 3); // Calculate total sets

  // Updated goToIndex to wrap the index around in a circular manner
  const goToIndex = useCallback(
    (index) => {
      setCurrentIndex(index % totalSets); // Ensures index wraps in a circular way
      // Pause auto-scrolling briefly when manually navigating
      setIsAutoScrolling(false);
      setTimeout(() => setIsAutoScrolling(true), 5000);
    },
    [totalSets]
  );

  useEffect(() => {
    if (!isAutoScrolling) return;

    // Automatically scroll to the next set every 4 seconds
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSets);
    }, 4000);

    return () => clearInterval(timer); // Cleanup the interval on unmount
  }, [isAutoScrolling, totalSets]);

  // Get the current set of features (3 at a time)
  const getCurrentFeatures = () => {
    const startIdx = currentIndex * 3;
    return FEATURES.slice(startIdx, startIdx + 3);
  };

  return (
    <div className="relative">
      {/* Features Container */}
      <div className="relative overflow-hidden" style={{ height: '280px' }}>
        <div
          className="transition-transform duration-1000 ease-in-out"
          style={{
            transform: `translateY(-${currentIndex * 280}px)`, // Scroll up based on currentIndex
          }}
        >
          {Array(totalSets)
            .fill(null)
            .map((_, setIndex) => {
              const startIdx = setIndex * 3;
              const setFeatures = FEATURES.slice(startIdx, startIdx + 3);

              return (
                <div
                  key={setIndex}
                  className="space-y-6 absolute top-0 left-0 w-full"
                  style={{ transform: `translateY(${setIndex * 280}px)` }}
                >
                  {setFeatures.map((feature, idx) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={`${feature.title}-${idx}`}
                        className="mt-10 flex items-start space-x-4 opacity-100 transition-opacity duration-500"
                      >
                        <div
                          className={`w-10 h-10 rounded-full ${feature.bgColor} flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-blue-200 leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 space-y-2 pr-2 pt-2">
        {Array(totalSets)
          .fill(null)
          .map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToIndex(idx)} // Circular navigation on manual click
              className={`block w-2 h-2 rounded-full transition-all duration-300 ${
                currentIndex === idx
                  ? 'bg-white scale-125'
                  : 'bg-blue-300 hover:bg-blue-200'
              }`}
              style={{
                boxShadow:
                  currentIndex === idx ? '0 0 10px rgb(30, 61, 158)' : 'none',
              }}
              aria-label={`Go to feature set ${idx + 1}`}
            />
          ))}
      </div>

      {/* Optional: Hover Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, transparent 90%, rgba(30,58,138,0.1) 100%)',
        }}
      />
    </div>
  );
};

const AWSLogo = () => (
  <svg
    className="w-32 h-auto pt-24"
    viewBox="0 0 304 182"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      // fill="#252F3E"
      fill="#ffffff"
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
    region: 'ap-south-1',
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
    { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
    { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
    { value: 'eu-west-1', label: 'Europe (Ireland)' },
    { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
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
          'Failed to validate AWS credentials. Please check your inputs.'
      );
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Company Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="w-full max-w-xl mx-auto px-8 py-12 flex flex-col justify-between">
          <div>
            <AWSLogo />
            <h1 className="mt-12 text-4xl font-bold">
              Docker Image Vulnerability Remediation System
            </h1>
            <p className="mt-4 text-lg text-blue-100">
              Secure your containerized applications with automated
              vulnerability scanning and real-time monitoring.
            </p>
          </div>

          {/* Replace the static features with the FeatureCarousel */}
          <div className="py-8 pt-2">
            <FeatureCarousel />
          </div>

          <div className="pt-12">
            <p className="text-sm text-blue-200">
              © 2024 Docker Image Vulnerability Remediation System. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md px-6 py-8">
          <div className="lg:hidden mb-8">
            <AWSLogo />
          </div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Sign in to Your Account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your AWS credentials to access the scanner
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="flex justify-between text-sm font-medium text-gray-700">
                <div className="flex items-center">
                  <Key className="w-4 h-4 mr-2 text-gray-400" />
                  Access Key ID
                </div>
                {!showHelp && (
                  <button
                    type="button"
                    onClick={() => setShowHelp(true)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Need help?
                  </button>
                )}
              </label>
              <input
                type="text"
                name="accessKeyId"
                value={credentials.accessKeyId}
                onChange={handleInputChange}
                className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="AKIAIOSFODNN7EXAMPLE"
                required
                pattern="[A-Z0-9]{20}"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center">
                  <Lock className="w-4 h-4 mr-2 text-gray-400" />
                  Secret Access Key
                </div>
              </label>
              <input
                type="password"
                name="secretAccessKey"
                value={credentials.secretAccessKey}
                onChange={handleInputChange}
                className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your AWS secret access key"
                required
                pattern="[A-Za-z0-9/+=]{40}"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
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
                  className="block w-full pl-4 pr-10 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg appearance-none"
                >
                  {regions.map((region) => (
                    <option key={region.value} value={region.value}>
                      {region.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {showHelp && (
              <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      How to find your AWS credentials
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ol className="list-decimal pl-5 space-y-2">
                        <li>Sign in to the AWS Management Console</li>
                        <li>Click your username at the top right</li>
                        <li>Select "Security credentials"</li>
                        <li>
                          Under "Access keys", create a new key or use an
                          existing one
                        </li>
                      </ol>
                      <button
                        type="button"
                        onClick={() => setShowHelp(false)}
                        className="mt-3 text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
                      >
                        Close help
                        <ArrowRight className="ml-1 w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <Alert
                variant="destructive"
                className="rounded-lg border-red-200 bg-red-50"
              >
                <AlertDescription className="flex items-center text-sm text-red-800">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="rounded-lg bg-green-50 border-green-200">
                <AlertDescription className="flex items-center text-sm text-green-800">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Successfully authenticated with AWS
                </AlertDescription>
              </Alert>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Authenticating
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <span className="text-sm text-gray-500">
                Need AWS credentials?{' '}
                <a
                  href="https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  Learn more
                </a>
              </span>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-4">
              <a
                href="https://aws.amazon.com/security/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Security
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="https://aws.amazon.com/compliance/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Compliance
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="https://aws.amazon.com/privacy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Privacy
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AWSAuthForm;
