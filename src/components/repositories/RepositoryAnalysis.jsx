// src/components/repositories/RepositoryAnalysis.jsx
import { useState, useEffect } from 'react';
import {
  Scan,
  List,
  AlertTriangle,
  CheckCircle,
  Loader,
  FileText,
  RefreshCw,
  Shield,
  Info,
  BarChart3,
  Package,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import useAuthStore from '../../store/authStore';
import {
  ECRClient,
  ListImagesCommand,
  StartImageScanCommand,
  DescribeImageScanFindingsCommand,
} from '@aws-sdk/client-ecr';

// 1. Add this import at the top with your other imports
import ImageDetailsModal from './ImageDetailsModal';

const VulnerabilitySummary = ({ scanResults }) => {
  // Define all possible severities with their display properties
  const severityLevels = [
    {
      severity: 'CRITICAL',
      icon: AlertTriangle,
      baseColor: 'red',
      description: 'Critical vulnerabilities that need immediate attention',
    },
    {
      severity: 'HIGH',
      icon: AlertTriangle,
      baseColor: 'orange',
      description: 'High-risk vulnerabilities requiring prompt action',
    },
    {
      severity: 'MEDIUM',
      icon: AlertTriangle,
      baseColor: 'yellow',
      description: 'Medium-risk vulnerabilities to be addressed',
    },
    {
      severity: 'LOW',
      icon: Info,
      baseColor: 'blue',
      description: 'Low-risk vulnerabilities to be reviewed',
    },
    {
      severity: 'INFORMATIONAL',
      icon: Info,
      baseColor: 'gray',
      description: 'Informational findings for review',
    },
  ];

  // Calculate summary including zero counts
  const summary = severityLevels.reduce((acc, { severity }) => {
    acc[severity] = 0;
    return acc;
  }, {});

  // Add actual counts if we have scan results
  Object.values(scanResults).forEach((result) => {
    result.findings.forEach((finding) => {
      summary[finding.severity] = (summary[finding.severity] || 0) + 1;
    });
  });

  const totalVulnerabilities = Object.values(summary).reduce(
    (a, b) => a + b,
    0
  );
  const secureImages = Object.values(scanResults).filter(
    (result) => result.findings.length === 0
  ).length;
  const totalScanned = Object.keys(scanResults).length;

  const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }) => (
    <div
      className={`bg-gray-50/50 rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-all duration-200 ${bgClass}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className="text-sm text-gray-500"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            {title}
          </p>
          <p
            className={`text-2xl font-semibold mt-1 ${colorClass}`}
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            {value}
          </p>
        </div>
        <Icon className={`w-8 h-8 ${colorClass}`} />
      </div>
    </div>
  );

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6 shadow-sm">
      <h3
        className="text-lg font-medium text-gray-900 mb-6 flex items-center"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
      >
        <Shield className="w-5 h-5 mr-2" />
        Security Overview
      </h3>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Vulnerabilities"
          value={totalVulnerabilities}
          icon={AlertTriangle}
          colorClass={
            totalVulnerabilities > 0 ? 'text-red-600' : 'text-gray-400'
          }
        />
        <StatCard
          title="Secure Images"
          value={secureImages}
          icon={Shield}
          colorClass="text-green-600"
        />
        <StatCard
          title="Scanned Images"
          value={totalScanned}
          icon={Package}
          colorClass="text-blue-600"
        />
      </div>

      {/* Severity Breakdown */}
      <div className="space-y-4">
        <h4
          className="text-sm font-medium text-gray-900 mb-2 flex items-center"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Findings by Severity
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {severityLevels.map(({ severity, baseColor }) => (
            <div
              key={severity}
              className={`bg-${baseColor}-50/50 backdrop-blur-sm border border-${baseColor}-200/50 rounded-xl p-4 hover:shadow-md transition-all duration-200`}
            >
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-${baseColor}-700 font-medium text-sm`}
                    style={{
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, sans-serif',
                    }}
                  >
                    {severity}
                  </span>
                  <span
                    className={`text-${baseColor}-600 text-2xl font-semibold`}
                    style={{
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, sans-serif',
                    }}
                  >
                    {summary[severity]}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div
                    className={`bg-${baseColor}-500 h-1.5 rounded-full transition-all duration-500`}
                    style={{
                      width:
                        totalVulnerabilities > 0
                          ? `${
                              (summary[severity] / totalVulnerabilities) * 100
                            }%`
                          : '0%',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scan Status Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-200/50">
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <p
                className="text-sm text-gray-600"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                }}
              >
                {totalVulnerabilities === 0 ? (
                  <>
                    <span className="font-medium text-green-600">
                      No vulnerabilities detected.{' '}
                    </span>
                    All scanned images are currently secure.
                  </>
                ) : (
                  <>
                    <span className="font-medium text-red-600">
                      {totalVulnerabilities} vulnerabilities found{' '}
                    </span>
                    across {totalScanned} scanned images.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Last Scan Time */}
      <div className="mt-4 text-sm text-gray-500 text-right">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
};

const RepositoryAnalysis = ({ repositoryName }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [scanResults, setScanResults] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const awsCredentials = useAuthStore((state) => state.awsCredentials);
  // 2. Add this new state with your other useState declarations
  const [selectedModalImage, setSelectedModalImage] = useState(null);

  const ecrClient = new ECRClient({
    region: awsCredentials.region,
    credentials: {
      accessKeyId: awsCredentials.accessKeyId,
      secretAccessKey: awsCredentials.secretAccessKey,
    },
  });

  // 3. Add this new function with your other functions
  const handleRunScraper = async (image) => {
    try {
      // Your web scraper logic here
      console.log('Running scraper for image:', image);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return true;
    } catch (error) {
      throw new Error('Failed to run web scraper: ' + error.message);
    }
  };

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const command = new ListImagesCommand({
        repositoryName: repositoryName,
      });
      const response = await ecrClient.send(command);
      setImages(response.imageIds || []);
    } catch (err) {
      setError(`Failed to fetch images: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startImageScan = async (imageDigest) => {
    try {
      const command = new StartImageScanCommand({
        repositoryName: repositoryName,
        imageId: {
          imageDigest: imageDigest,
        },
      });
      await ecrClient.send(command);
      return true;
    } catch (err) {
      setError(`Failed to start scan: ${err.message}`);
      return false;
    }
  };

  const getScanResults = async (imageDigest) => {
    try {
      const command = new DescribeImageScanFindingsCommand({
        repositoryName: repositoryName,
        imageId: {
          imageDigest: imageDigest,
        },
      });
      const response = await ecrClient.send(command);
      return response.imageScanFindings;
    } catch (err) {
      setError(`Failed to get scan results: ${err.message}`);
      return null;
    }
  };

  const handleScanAll = async () => {
    setScanning(true);
    setError(null);

    try {
      // Start scan for all images
      for (const image of images) {
        await startImageScan(image.imageDigest);
      }

      // Wait for scans to complete and collect results
      const results = {};
      for (const image of images) {
        const findings = await getScanResults(image.imageDigest);
        if (findings) {
          results[image.imageDigest] = findings;
        }
      }

      setScanResults(results);
    } catch (err) {
      setError(`Scan process failed: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (repositoryName) {
      fetchImages();
    }
  }, [repositoryName]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2
              className="text-2xl font-semibold text-gray-900"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              }}
            >
              Repository Analysis
            </h2>
            <p
              className="mt-1 text-gray-500"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              }}
            >
              {repositoryName}
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={fetchImages}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white/90 border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              }}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>
            <button
              onClick={handleScanAll}
              disabled={scanning || loading || images.length === 0}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-xl shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              }}
            >
              {scanning ? (
                <Loader className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              {scanning ? 'Scanning...' : 'Scan All Images'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          variant="destructive"
          className="bg-red-50/80 backdrop-blur-xl border-red-200 rounded-xl"
        >
          <AlertDescription className="flex items-center text-red-800">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Vulnerability Summary Section - Always show this section */}
      <VulnerabilitySummary scanResults={scanResults} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Images List */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6 shadow-sm">
          <h3
            className="text-lg font-medium text-gray-900 mb-4 flex items-center"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            <List className="w-5 h-5 mr-2" />
            Images ({images.length})
          </h3>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2">Loading images...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {images.map((image) => (
                <div
                  key={image.imageDigest}
                  onClick={() => setSelectedImage(image)}
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    selectedImage?.imageDigest === image.imageDigest
                      ? 'border-blue-200 bg-blue-50/50'
                      : 'border-gray-200/50 bg-white/50 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p
                        className="font-medium text-gray-900"
                        style={{
                          fontFamily:
                            '-apple-system, BlinkMacSystemFont, sans-serif',
                        }}
                      >
                        {image.imageTag || 'untagged'}
                      </p>
                      <p
                        className="text-sm text-gray-500 mt-1"
                        style={{
                          fontFamily:
                            '-apple-system, BlinkMacSystemFont, sans-serif',
                        }}
                      >
                        {image.imageDigest.substring(0, 20)}...
                      </p>
                    </div>
                    {/* 5. Replace or update the existing action buttons section */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedModalImage(image);
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
                      >
                        View Details
                      </button>
                      {/* Keep your existing scan status indicators */}
                      {scanResults[image.imageDigest] ? (
                        <div className="flex items-center">
                          {scanResults[image.imageDigest].findings.length >
                          0 ? (
                            <span className="text-red-600 flex items-center">
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              {scanResults[image.imageDigest].findings.length}
                            </span>
                          ) : (
                            <span className="text-green-600 flex items-center">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Secure
                            </span>
                          )}
                        </div>
                      ) : (
                        scanning && (
                          <span className="text-blue-600 flex items-center">
                            <Loader className="w-4 h-4 animate-spin" />
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scan Results */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6 shadow-sm">
          <h3
            className="text-lg font-medium text-gray-900 mb-4 flex items-center"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            <FileText className="w-5 h-5 mr-2" />
            Scan Results
          </h3>

          {selectedImage && scanResults[selectedImage.imageDigest] ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50/50 border border-gray-200/50">
                <h4
                  className="font-medium text-gray-900 mb-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                  }}
                >
                  {selectedImage.imageTag || 'untagged'}
                </h4>

                {scanResults[selectedImage.imageDigest].findings.length > 0 ? (
                  <div className="space-y-3">
                    {scanResults[selectedImage.imageDigest].findings.map(
                      (finding, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-xl bg-white border border-gray-200/50 transition-all duration-200 hover:shadow-sm"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h5
                              className="font-medium text-gray-900"
                              style={{
                                fontFamily:
                                  '-apple-system, BlinkMacSystemFont, sans-serif',
                              }}
                            >
                              {finding.name}
                            </h5>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                finding.severity === 'CRITICAL'
                                  ? 'bg-red-100 text-red-800'
                                  : finding.severity === 'HIGH'
                                  ? 'bg-orange-100 text-orange-800'
                                  : finding.severity === 'MEDIUM'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : finding.severity === 'LOW'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {finding.severity}
                            </span>
                          </div>
                          <p
                            className="text-sm text-gray-600 mb-2"
                            style={{
                              fontFamily:
                                '-apple-system, BlinkMacSystemFont, sans-serif',
                            }}
                          >
                            {finding.description}
                          </p>
                          {finding.remediation && (
                            <div className="mt-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                              <div className="flex items-center text-sm text-blue-800 mb-1">
                                <Info className="w-4 h-4 mr-1" />
                                Remediation
                              </div>
                              <p
                                className="text-sm text-blue-700"
                                style={{
                                  fontFamily:
                                    '-apple-system, BlinkMacSystemFont, sans-serif',
                                }}
                              >
                                {finding.remediation}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p
                      className="text-lg font-medium text-green-700"
                      style={{
                        fontFamily:
                          '-apple-system, BlinkMacSystemFont, sans-serif',
                      }}
                    >
                      No vulnerabilities found
                    </p>
                    <p
                      className="text-sm text-green-600 mt-1"
                      style={{
                        fontFamily:
                          '-apple-system, BlinkMacSystemFont, sans-serif',
                      }}
                    >
                      This image passed all security checks
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Info className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p
                className="text-gray-500"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                }}
              >
                {scanning
                  ? 'Scanning in progress...'
                  : 'Select an image to view scan results'}
              </p>
            </div>
          )}
        </div>
      </div>
      {selectedModalImage && (
        <ImageDetailsModal
          isOpen={!!selectedModalImage}
          onClose={() => setSelectedModalImage(null)}
          image={selectedModalImage}
          scanResults={scanResults}
          repositoryName={repositoryName}
          onRunScraper={handleRunScraper}
        />
      )}
    </div>
  );
};

export default RepositoryAnalysis;
