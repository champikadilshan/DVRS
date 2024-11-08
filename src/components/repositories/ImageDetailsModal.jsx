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
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

const ImageDetailsModal = ({
  isOpen,
  onClose,
  image,
  scanResults,
  repositoryName,
  onRunScraper,
}) => {
  const [isScraperRunning, setIsScraperRunning] = useState(false);
  const [scraperError, setScraperError] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

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

  if (!isOpen) return null;

  const handleRunScraper = async () => {
    setIsScraperRunning(true);
    setScraperError(null);
    try {
      await onRunScraper(image);
    } catch (error) {
      setScraperError(error.message);
    } finally {
      setIsScraperRunning(false);
    }
  };

  const findings = scanResults?.[image?.imageDigest]?.findings || [];
  const severityCounts = findings.reduce((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] || 0) + 1;
    return acc;
  }, {});

  const copyDigest = async () => {
    await navigator.clipboard.writeText(image.imageDigest);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const modalContent = (
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
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
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

          {/* Web Scraper Section */}
          <div className="bg-blue-50/30 rounded-lg p-4 border border-blue-200/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Terminal className="w-5 h-5 text-blue-600 mr-2" />
                <h4 className="text-sm font-medium text-gray-900">
                  Vulnerability Analysis
                </h4>
              </div>
              <button
                onClick={handleRunScraper}
                disabled={isScraperRunning}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
              >
                {isScraperRunning ? (
                  <>
                    <Loader className="w-4 h-4 mr-1.5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Terminal className="w-4 h-4 mr-1.5" />
                    Run Analysis
                  </>
                )}
              </button>
            </div>

            {scraperError && (
              <Alert variant="destructive" className="mt-3">
                <AlertDescription className="flex items-center text-red-800 text-sm">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {scraperError}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Vulnerability Summary */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Shield className="w-4 h-4 text-gray-600 mr-1.5" />
                Security Overview
              </h4>
              <span className="text-xs text-gray-500 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1" />
                Last scanned: {new Date().toLocaleString()}
              </span>
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

          {/* Findings List */}
          {findings.length > 0 ? (
            <div className="space-y-3">
              {findings.map((finding, index) => (
                <div
                  key={index}
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
                </div>
              ))}
            </div>
          ) : (
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
  );

  return <ModalPortal>{modalContent}</ModalPortal>;
};

export default ImageDetailsModal;
