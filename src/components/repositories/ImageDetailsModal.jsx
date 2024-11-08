// src/components/repositories/ImageDetailsModal.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CheckCircle,
  Loader,
  X,
  Terminal,
  Clock,
  Shield,
  Info,
  Copy,
  ExternalLink,
  Search,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { vulnerabilityScraper } from '../../services/scraping/vulnerabilityScraper';

const SeverityBadge = ({ severity, count }) => {
  const variants = {
    CRITICAL: 'bg-red-50/50 text-red-700 border-red-200/50',
    HIGH: 'bg-orange-50/50 text-orange-700 border-orange-200/50',
    MEDIUM: 'bg-yellow-50/50 text-yellow-700 border-yellow-200/50',
    LOW: 'bg-blue-50/50 text-blue-700 border-blue-200/50',
    INFORMATIONAL: 'bg-gray-50/50 text-gray-600 border-gray-200/50',
  };

  return (
    <div
      className={`backdrop-blur-sm border rounded-lg p-3 transition-all duration-200 ${
        variants[severity]
      } ${count > 0 ? 'shadow-sm' : 'opacity-75'}`}
    >
      <div className="flex flex-col">
        <span className="text-xs font-medium">{severity}</span>
        <span className="text-xl font-semibold mt-0.5">{count}</span>
      </div>
    </div>
  );
};

const ModalPortal = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return mounted ? createPortal(children, document.body) : null;
};

const ImageDetailsModal = ({
  isOpen,
  onClose,
  image,
  scanResults,
  repositoryName,
}) => {
  const [isScraperRunning, setIsScraperRunning] = useState(false);
  const [scraperError, setScraperError] = useState(null);
  const [scrapedData, setScrapedData] = useState({});
  const [isCopied, setIsCopied] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState(null);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleRunScraper = async (finding) => {
    if (!finding.uri) {
      setScraperError('No vulnerability URI available for scraping');
      return;
    }

    setIsScraperRunning(true);
    setScraperError(null);
    setSelectedFinding(finding);

    try {
      const scrapedDetails =
        await vulnerabilityScraper.scrapeVulnerabilityDetails(finding.uri);

      setScrapedData((prev) => ({
        ...prev,
        [finding.name]: scrapedDetails,
      }));
    } catch (error) {
      setScraperError(
        `Failed to scrape vulnerability details: ${error.message}`
      );
    } finally {
      setIsScraperRunning(false);
    }
  };

  // Add this inside ImageDetailsModal component
  const renderScrapingStatus = (finding) => {
    if (!isScraperRunning || selectedFinding?.name !== finding.name) {
      return null;
    }

    return (
      <div className="mt-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100/50">
        <div className="flex items-center space-x-2">
          <Loader className="w-4 h-4 animate-spin text-blue-600" />
          <p className="text-sm text-blue-700">
            Analyzing vulnerability details...
          </p>
        </div>
        <div className="mt-2">
          <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full animate-pulse"
              style={{ width: '60%' }}
            ></div>
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          Browser window will open automatically...
        </p>
      </div>
    );
  };

  const copyDigest = async () => {
    await navigator.clipboard.writeText(image.imageDigest);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) return null;

  const findings = scanResults?.[image?.imageDigest]?.findings || [];
  const severityCounts = findings.reduce((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] || 0) + 1;
    return acc;
  }, {});

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-md z-[9999] flex items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="relative bg-white/95 backdrop-blur-xl w-full max-w-4xl max-h-[85vh] rounded-xl shadow-2xl border border-gray-200/50 overflow-hidden mx-4"
          onClick={(e) => e.stopPropagation()}
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200/50">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {image.imageTag || 'untagged'}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Repository: {repositoryName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6 max-h-[calc(85vh-8rem)] space-y-6">
            {/* Image Details */}
            <div className="flex items-center justify-between bg-gray-50/50 px-4 py-3 rounded-lg border border-gray-200/50">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 mb-0.5">Image Digest</p>
                <p className="font-mono text-sm text-gray-900 truncate">
                  {image.imageDigest}
                </p>
              </div>
              <button
                onClick={copyDigest}
                className="ml-3 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Copy digest"
              >
                {isCopied ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Severity Overview */}
            <div className="grid grid-cols-5 gap-3">
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'].map(
                (severity) => (
                  <SeverityBadge
                    key={severity}
                    severity={severity}
                    count={severityCounts[severity] || 0}
                  />
                )
              )}
            </div>

            {/* Scraper Error Alert */}
            {scraperError && (
              <Alert variant="destructive" className="rounded-lg">
                <AlertDescription className="flex items-center text-red-800">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {scraperError}
                </AlertDescription>
              </Alert>
            )}

            {/* Findings List */}
            <div className="space-y-4">
              {findings.map((finding) => (
                <div
                  key={finding.name}
                  className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="text-sm font-medium text-gray-900">
                      {finding.name}
                    </h5>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
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

                  <p className="text-sm text-gray-600 mb-3">
                    {finding.description}
                  </p>

                  {finding.remediation && (
                    <div className="bg-blue-50/50 rounded-md p-3 border border-blue-100/50">
                      <div className="flex items-center text-xs font-medium text-blue-800 mb-1">
                        <Info className="w-3.5 h-3.5 mr-1" />
                        Recommended Fix
                      </div>
                      <p className="text-sm text-blue-700">
                        {finding.remediation}
                      </p>
                    </div>
                  )}

                  {renderScrapingStatus(finding)}

                  {/* Scraped Data Display */}
                  {scrapedData[finding.name] && (
                    <div className="mt-4 p-4 bg-gray-50/50 rounded-lg border border-gray-200/50">
                      <h6 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                        <Search className="w-4 h-4 mr-1.5" />
                        Additional Details
                      </h6>
                      <div className="space-y-2 text-sm text-gray-700">
                        {Object.entries(scrapedData[finding.name]).map(
                          ([key, value]) =>
                            value && (
                              <div key={key} className="flex flex-col">
                                <span className="font-medium text-gray-900 capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                                </span>
                                <span className="text-gray-600 mt-0.5">
                                  {Array.isArray(value)
                                    ? value.join(', ')
                                    : value}
                                </span>
                              </div>
                            )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 flex items-center justify-end space-x-3">
                    {finding.uri && (
                      <>
                        <button
                          onClick={() => handleRunScraper(finding)}
                          disabled={
                            isScraperRunning &&
                            selectedFinding?.name === finding.name
                          }
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
                        >
                          {isScraperRunning &&
                          selectedFinding?.name === finding.name ? (
                            <>
                              <Loader className="w-4 h-4 mr-1.5 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Search className="w-4 h-4 mr-1.5" />
                              Analyze
                            </>
                          )}
                        </button>
                        <a
                          href={finding.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          View Source <ExternalLink className="w-4 h-4 ml-1" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {findings.length === 0 && (
                <div className="text-center py-8 bg-green-50/30 rounded-lg border border-green-200/50">
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-green-700">
                    No vulnerabilities detected
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    This image has passed all security checks
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200/50 bg-gray-50/50">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default ImageDetailsModal;
