// src/components/repositories/ImageDetailsModal.jsx - FIXED VERSION

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  PlayCircle,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { vulnerabilityScraper } from '../../services/scraping/vulnerabilityScraper';

// Source options with enabled property
const SCRAPING_SOURCES = [
  {
    id: 'official',
    name: 'Official Documentation',
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Vendor security advisories and official documentation',
    enabled: true
  },
  {
    id: 'stackoverflow',
    name: 'Stack Overflow',
    icon: MessageSquare,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    description: 'Community discussions and solutions',
    enabled: true
  },
  {
    id: 'snyk',
    name: 'Snyk Security',
    icon: Shield,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'Snyk vulnerability database and security insights',
    enabled: true
  },
  {
    id: 'github',
    name: 'GitHub Issues',
    icon: Code,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    description: 'Related issues and pull requests',
    enabled: false
  },
  {
    id: 'cve',
    name: 'CVE Database',
    icon: Database,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'Common Vulnerabilities and Exposures details',
    enabled: false
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

const SourceSelector = ({ selectedSources, onSourceToggle, finding, disabled = false }) => (
  <div className="grid grid-cols-2 gap-3">
    {SCRAPING_SOURCES.map((source) => {
      const Icon = source.icon;
      const isSelected = selectedSources.includes(source.id);
      const isDisabled = !source.enabled || disabled;

      return (
        <button
          key={source.id}
          onClick={() => !isDisabled && onSourceToggle(source.id)}
          disabled={isDisabled}
          className={`
            relative flex flex-col p-3 rounded-lg border transition-all duration-200
            ${isSelected ? 'bg-blue-50/50 border-blue-200' : 'border-gray-200 hover:bg-gray-50'}
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            group
          `}
        >
          <div
            className={`
              absolute top-2 right-2 w-4 h-4 rounded-full border transition-all duration-200
              flex items-center justify-center
              ${isSelected ? 'bg-blue-600 border-transparent' : 'border-gray-300 bg-white'}
            `}
          >
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </div>

          <div className="flex min-h-[60px]">
            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${source.color}`} />
            <div className="ml-2.5 flex-1">
              <div className="flex items-center">
                <p className={`text-sm font-medium ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
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
        </button>
      );
    })}
  </div>
);

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
  const navigate = useNavigate();
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [scraperError, setScraperError] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedSources, setSelectedSources] = useState(['snyk']); // Default to Snyk
  const [selectedCVEs, setSelectedCVEs] = useState(new Set());
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, currentCVE: '' });
  const [collectedUrls, setCollectedUrls] = useState([]);

  const findings = scanResults?.[image?.imageDigest]?.findings || [];

  // FIXED: Better CVE extraction
  const extractCVECodes = useCallback(() => {
    const cvePattern = /CVE-\d{4}-\d+/gi;
    const cves = new Set(); // Use Set to avoid duplicates
    
    // Extract from finding names and descriptions
    findings.forEach(finding => {
      // From finding name
      if (finding.name) {
        const nameCVEs = finding.name.match(cvePattern) || [];
        nameCVEs.forEach(cve => cves.add(cve.toUpperCase()));
      }
      
      // From finding description
      if (finding.description) {
        const descCVEs = finding.description.match(cvePattern) || [];
        descCVEs.forEach(cve => cves.add(cve.toUpperCase()));
      }
      
      // Sometimes CVE is in the URI
      if (finding.uri) {
        const uriCVEs = finding.uri.match(cvePattern) || [];
        uriCVEs.forEach(cve => cves.add(cve.toUpperCase()));
      }
    });
    
    console.log('Extracted CVEs:', Array.from(cves));
    return Array.from(cves);
  }, [findings]);

  const availableCVEs = extractCVECodes();

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
    setSelectedSources((prev) => {
      const newSources = prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId];
      return newSources;
    });
  };

  const handleCVEToggle = (cve) => {
    setSelectedCVEs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cve)) {
        newSet.delete(cve);
      } else {
        newSet.add(cve);
      }
      return newSet;
    });
  };

  const handleSelectAllCVEs = () => {
    if (selectedCVEs.size === availableCVEs.length) {
      setSelectedCVEs(new Set()); // Deselect all
    } else {
      setSelectedCVEs(new Set(availableCVEs)); // Select all
    }
  };

  // FIXED: Enhanced batch scraping with proper error handling
  const handleBatchScrape = async () => {
    if (selectedCVEs.size === 0) {
      setScraperError('Please select at least one CVE');
      return;
    }
    
    if (selectedSources.length === 0) {
      setScraperError('Please select at least one source');
      return;
    }

    setIsBatchProcessing(true);
    setScraperError(null);
    setCollectedUrls([]);
    
    const cveArray = Array.from(selectedCVEs);
    setBatchProgress({ current: 0, total: cveArray.length, currentCVE: 'Initializing...' });

    try {
      console.log('Starting batch scraping for:', cveArray, 'with sources:', selectedSources);
      
      // Use the batch scraping service
      const result = await vulnerabilityScraper.batchScrapeCVEs(cveArray, selectedSources);
      
      console.log('Batch scraping result:', result);
      
      if (result.success) {
        const urlsCollected = result.allUrls || [];
        setCollectedUrls(urlsCollected);
        
        console.log('URLs collected:', urlsCollected.length);
        
        // Create enhanced data to pass to logs page
        const enhancedData = {
          ...result.data,
          cveList: cveArray,
          selectedSources: selectedSources,
          findings: findings,
          repositoryName: repositoryName,
          imageTag: image?.imageTag,
          imageDigest: image?.imageDigest,
          batchSummary: {
            totalCVEs: cveArray.length,
            selectedSources: selectedSources,
            urlsCollected: urlsCollected.length,
            timestamp: new Date().toISOString()
          }
        };
        
        // Store the enhanced data in sessionStorage for the logs page
        sessionStorage.setItem('batchScrapingData', JSON.stringify(enhancedData));
        
        // Navigate to logs page
        if (result.savedAs) {
          const logId = result.savedAs.split('.')[0];
          onClose();
          navigate(`/logs/${logId}`);
        } else {
          const logId = `batch-${Date.now()}`;
          onClose();
          navigate(`/logs/${logId}`);
        }
      } else {
        throw new Error(result.message || 'Batch scraping completed but returned unsuccessful status');
      }
      
    } catch (error) {
      console.error('Batch scraping error:', error);
      setScraperError(`Batch scraping failed: ${error.message}`);
    } finally {
      setIsBatchProcessing(false);
      setBatchProgress({ current: 0, total: 0, currentCVE: '' });
    }
  };

  const copyDigest = async () => {
    await navigator.clipboard.writeText(image.imageDigest);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) return null;

  const severityCounts = findings.reduce((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] || 0) + 1;
    return acc;
  }, {});

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-md z-[9999] flex items-center justify-center">
        <div className="relative bg-white/95 backdrop-blur-xl w-full max-w-5xl max-h-[90vh] rounded-xl shadow-2xl border border-gray-200/50 overflow-hidden mx-4">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200/50 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Vulnerability Analysis
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {repositoryName} • {image?.imageTag || 'untagged'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6 max-h-[calc(90vh-8rem)] space-y-6">
            
            {/* Debug: Show extracted CVEs */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Debug: CVE Extraction</h4>
                <p className="text-xs text-yellow-700">
                  Total findings: {findings.length}
                </p>
                <p className="text-xs text-yellow-700">
                  Extracted CVEs: {availableCVEs.join(', ') || 'None found'}
                </p>
                <details className="mt-2">
                  <summary className="text-xs text-yellow-700 cursor-pointer">Show findings details</summary>
                  <pre className="text-xs text-yellow-600 mt-1 overflow-auto max-h-32">
                    {JSON.stringify(findings.map(f => ({ name: f.name, description: f.description?.substring(0, 100) })), null, 2)}
                  </pre>
                </details>
              </div>
            )}
            
            {/* Batch Processing Section */}
            {availableCVEs.length > 0 ? (
              <div className="bg-blue-50/50 rounded-lg p-6 border border-blue-200/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <PlayCircle className="w-5 h-5 mr-2 text-blue-600" />
                    Batch CVE Analysis
                  </h3>
                  <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    {availableCVEs.length} CVEs Found
                  </span>
                </div>

                {/* CVE Selection */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      Select CVEs to Process:
                    </label>
                    <button
                      onClick={handleSelectAllCVEs}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      {selectedCVEs.size === availableCVEs.length ? (
                        <CheckSquare className="w-4 h-4 mr-1" />
                      ) : (
                        <Square className="w-4 h-4 mr-1" />
                      )}
                      {selectedCVEs.size === availableCVEs.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableCVEs.map(cve => (
                      <button
                        key={cve}
                        onClick={() => handleCVEToggle(cve)}
                        disabled={isBatchProcessing}
                        className={`
                          flex items-center p-2 rounded border text-sm transition-colors
                          ${selectedCVEs.has(cve) 
                            ? 'bg-blue-100 border-blue-300 text-blue-800' 
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }
                          ${isBatchProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        {selectedCVEs.has(cve) ? (
                          <CheckSquare className="w-4 h-4 mr-2" />
                        ) : (
                          <Square className="w-4 h-4 mr-2" />
                        )}
                        {cve}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Source Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Sources to Scrape:
                  </label>
                  <SourceSelector
                    selectedSources={selectedSources}
                    onSourceToggle={handleSourceToggle}
                    finding={{}}
                    disabled={isBatchProcessing}
                  />
                </div>

                {/* Progress Display */}
                {isBatchProcessing && (
                  <div className="mb-4 p-3 bg-blue-100 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800">
                        Processing CVEs...
                      </span>
                      <span className="text-sm text-blue-600">
                        {batchProgress.current}/{batchProgress.total}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${batchProgress.total > 0 ? (batchProgress.current / batchProgress.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                    {batchProgress.currentCVE && (
                      <p className="text-xs text-blue-700">
                        Currently processing: {batchProgress.currentCVE}
                      </p>
                    )}
                  </div>
                )}

                {/* Batch Action Button */}
                <button
                  onClick={handleBatchScrape}
                  disabled={isBatchProcessing || selectedCVEs.size === 0 || selectedSources.length === 0}
                  className={`
                    w-full flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${!isBatchProcessing && selectedCVEs.size > 0 && selectedSources.length > 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {isBatchProcessing ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Processing {selectedCVEs.size} CVEs...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Run Batch Analysis ({selectedCVEs.size} CVEs, {selectedSources.length} Sources)
                    </>
                  )}
                </button>

                {/* Collected URLs Display */}
                {collectedUrls.length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800 mb-2">
                      Collected URLs ({collectedUrls.length}):
                    </h4>
                    <div className="max-h-32 overflow-y-auto text-xs text-green-700 space-y-1">
                      {collectedUrls.map((url, index) => (
                        <div key={index} className="break-all">{url}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50/50 rounded-lg p-6 border border-yellow-200/50">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <div>
                    <h3 className="text-lg font-medium text-yellow-800">No CVEs Found</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      No CVE codes were detected in the vulnerability findings. This could mean:
                    </p>
                    <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
                      <li>The vulnerabilities don't have assigned CVE numbers yet</li>
                      <li>The CVE codes are in a different format</li>
                      <li>The scan results are clean (no vulnerabilities)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {scraperError && (
              <Alert variant="destructive" className="rounded-lg border-red-200 bg-red-50">
                <AlertDescription className="flex items-center text-sm text-red-800">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {scraperError}
                </AlertDescription>
              </Alert>
            )}

            {/* Individual Findings List */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Individual CVE Details</h3>
              {findings.map((finding) => (
                <div
                  key={finding.name}
                  className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 hover:shadow-sm transition-all duration-200"
                >
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