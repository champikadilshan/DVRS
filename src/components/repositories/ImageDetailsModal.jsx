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
  Globe,
  BookOpen,
  MessageSquare,
  Code,
  Database,
  Check,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { vulnerabilityScraper } from '../../services/scraping/vulnerabilityScraper';

// Source options for future implementation
const SCRAPING_SOURCES = [
  {
    id: 'official',
    name: 'Official Documentation',
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Vendor security advisories and official documentation',
  },
  {
    id: 'stackoverflow',
    name: 'Stack Overflow',
    icon: MessageSquare,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    description: 'Community discussions and solutions',
  },
  {
    id: 'github',
    name: 'GitHub Issues',
    icon: Code,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    description: 'Related issues and pull requests',
  },
  {
    id: 'cve',
    name: 'CVE Database',
    icon: Database,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'Common Vulnerabilities and Exposures details',
  },
];

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

// Add these URL construction functions at the top level
const getSourceUrl = (source, finding) => {
  switch (source.id) {
    case 'official':
      return finding.uri; // Keep original URI for official docs
    case 'stackoverflow':
      return `https://stackoverflow.com/search?q=${encodeURIComponent(
        `${finding.name} vulnerability`
      )}`;
    case 'github':
      return `https://github.com/search?q=${encodeURIComponent(
        `${finding.name} security vulnerability`
      )}&type=issues`;
    case 'cve':
      // Extract CVE ID if present, otherwise use the finding name
      const cveMatch = finding.name.match(/CVE-\d{4}-\d+/i);
      const cveId = cveMatch ? cveMatch[0] : finding.name;
      return `https://nvd.nist.gov/vuln/search/results?form_type=Basic&results_type=overview&query=${encodeURIComponent(
        cveId
      )}`;
    default:
      return finding.uri;
  }
};

// Replace the existing SourceSelector component with this improved version
const SourceSelector = ({ selectedSources, onSourceToggle, finding }) => (
  <div className="grid grid-cols-2 gap-3">
    {SCRAPING_SOURCES.map((source) => {
      const Icon = source.icon;
      const isSelected = selectedSources.includes(source.id);
      const isDisabled = source.id !== 'official';
      const sourceUrl = getSourceUrl(source, finding);

      return (
        <button
          key={source.id}
          onClick={() => onSourceToggle(source.id)}
          disabled={isDisabled}
          className={`
              relative flex flex-col p-3 rounded-lg border transition-all duration-200
              ${
                isSelected
                  ? 'bg-blue-50/50 border-blue-200'
                  : 'border-gray-200 hover:bg-gray-50'
              }
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              group
            `}
        >
          {/* Checkbox indicator */}
          <div
            className={`
              absolute top-2 right-2 w-4 h-4 rounded-full border transition-all duration-200
              flex items-center justify-center
              ${
                isSelected
                  ? 'bg-blue-600 border-transparent'
                  : 'border-gray-300 bg-white'
              }
            `}
          >
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </div>

          <div className="flex min-h-[60px]">
            <Icon
              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${source.color} ${
                isDisabled ? 'opacity-50' : ''
              }`}
            />
            <div className="ml-2.5 flex-1">
              <div className="flex items-center">
                <p
                  className={`text-sm font-medium ${
                    isSelected ? 'text-blue-600' : 'text-gray-900'
                  } ${isDisabled ? 'opacity-50' : ''}`}
                >
                  {source.name}
                </p>
                {isDisabled && (
                  <span className="ml-2 text-xs text-gray-500 px-1.5 py-0.5 bg-gray-100 rounded-full">
                    Soon
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                {source.description}
              </p>
            </div>
          </div>

          {/* View Source Link with Dynamic URL */}
          {sourceUrl && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  // Track or log source visits if needed
                  console.log(
                    `Visiting ${source.name} source for ${finding.name}`
                  );
                }}
                className={`
                    text-xs flex items-center 
                    ${
                      isDisabled
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-500 hover:text-gray-700'
                    }
                  `}
              >
                {isDisabled ? (
                  'View Source'
                ) : (
                  <>
                    View on {source.name}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </>
                )}
              </a>
            </div>
          )}
        </button>
      );
    })}
  </div>
);

const SourceResults = ({ source, data, isLoading }) => {
  const Icon = source.icon;

  if (isLoading) {
    return (
      <div
        className={`p-4 rounded-lg ${source.bgColor} border border-${source.color}/20`}
      >
        <div className="flex items-center">
          <Icon className={`w-5 h-5 ${source.color}`} />
          <span className={`ml-2 text-sm font-medium ${source.color}`}>
            {source.name}
          </span>
          <Loader className={`w-4 h-4 ml-2 animate-spin ${source.color}`} />
        </div>
        <div className="mt-3 space-y-2">
          <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      className={`p-4 rounded-lg ${source.bgColor} border border-${source.color}/20`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Icon className={`w-5 h-5 ${source.color}`} />
          <span className={`ml-2 text-sm font-medium ${source.color}`}>
            {source.name}
          </span>
        </div>
        <a
          href={data.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-xs flex items-center ${source.color} hover:opacity-80`}
        >
          View Source <ExternalLink className="w-3 h-3 ml-1" />
        </a>
      </div>
      <div className="mt-3 space-y-3">
        {data.findings?.map((finding, index) => (
          <div key={index} className="text-sm">
            <p className="text-gray-900 font-medium">{finding.title}</p>
            <p className="text-gray-600 mt-1">{finding.description}</p>
            {finding.code && (
              <pre className="mt-2 p-2 bg-gray-800 rounded text-gray-100 text-xs overflow-x-auto">
                <code>{finding.code}</code>
              </pre>
            )}
          </div>
        ))}
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
  const [isCopied, setIsCopied] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [selectedSources, setSelectedSources] = useState(['official']);

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
      // Keep the original cleanup
      if (vulnerabilityScraper?.close) {
        try {
          vulnerabilityScraper.close();
        } catch (error) {
          console.error('Error closing scraper:', error);
        }
      }
    };
  }, [isOpen, onClose]);

  const handleSourceToggle = (sourceId) => {
    // Only allow toggling official source for now
    if (sourceId === 'official') {
      setSelectedSources((prev) =>
        prev.includes(sourceId)
          ? prev.filter((id) => id !== sourceId)
          : [...prev, sourceId]
      );
    }
  };

  const handleRunScraper = async (finding) => {
    if (!finding.uri) {
      setScraperError('No vulnerability URI available for scraping');
      return;
    }

    setIsScraperRunning(true);
    setScraperError(null);
    setSelectedFinding(finding);

    try {
      // Use the original scraping implementation
      await vulnerabilityScraper.scrapeVulnerabilityDetails(finding.uri);
    } catch (error) {
      setScraperError(
        `Failed to scrape vulnerability details: ${error.message}`
      );
    } finally {
      setIsScraperRunning(false);
    }
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
      {/* Keep your existing modal structure */}
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-md z-[9999] flex items-center justify-center">
        <div className="relative bg-white/95 backdrop-blur-xl w-full max-w-4xl max-h-[85vh] rounded-xl shadow-2xl border border-gray-200/50 overflow-hidden mx-4">
          {/* Your existing header */}
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

            {/* Severity Overview - Added back */}
            <div className="bg-white/80 backdrop-blur-xl rounded-lg p-4 border border-gray-200/50">
              <div className="mb-3 flex items-center">
                <Shield className="w-4 h-4 text-gray-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-900">
                  Vulnerability Summary
                </h3>
              </div>
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
            </div>

            {/* Error Alert */}
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
                  {/* Finding details */}
                  <div className="flex justify-between items-start mb-4">
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

                  <p className="text-sm text-gray-600 mb-4">
                    {finding.description}
                  </p>

                  {/* Source Selection */}
                  <div className="relative pb-16">
                    {' '}
                    {/* Add padding bottom for fixed button */}
                    <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-200/50">
                      <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                        <Globe className="w-4 h-4 mr-1.5" />
                        Select Analysis Sources
                      </h3>
                      <SourceSelector
                        selectedSources={selectedSources}
                        onSourceToggle={handleSourceToggle}
                        finding={finding}
                      />
                    </div>
                    {/* Fixed position analyze button */}
                    <div className="absolute bottom-0 left-0 right-0 py-3 bg-white/80 backdrop-blur-sm border-t border-gray-200">
                      <button
                        onClick={() => handleRunScraper(finding)}
                        disabled={
                          isScraperRunning || selectedSources.length === 0
                        }
                        className={`
              w-full inline-flex items-center justify-center px-4 py-2.5 
              text-sm font-medium rounded-lg transition-all duration-200
              ${
                selectedSources.length > 0
                  ? 'text-white bg-gray-900 hover:bg-gray-800'
                  : 'text-gray-400 bg-gray-100 cursor-not-allowed'
              }
              disabled:opacity-50
            `}
                      >
                        {isScraperRunning &&
                        selectedFinding?.name === finding.name ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            <span>Analyzing Sources...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4 mr-2" />
                            <span>
                              {selectedSources.length > 0
                                ? 'Analyze Selected Sources'
                                : 'Select a source to analyze'}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remediation section if needed */}
                  {finding.remediation && (
                    <div className="mt-4 bg-blue-50/50 rounded-md p-3 border border-blue-100/50">
                      <div className="flex items-center text-xs font-medium text-blue-800 mb-1">
                        <Info className="w-3.5 h-3.5 mr-1" />
                        Recommended Fix
                      </div>
                      <p className="text-sm text-blue-700">
                        {finding.remediation}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* No findings message remains the same */}
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
