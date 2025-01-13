// src/components/repositories/ImageDetailsModal.jsx

import { useState, useEffect } from 'react';

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



// Your existing SeverityBadge component remains unchanged

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



// Updated getSourceUrl function

const getSourceUrl = (source, finding) => {

  switch (source.id) {

    case 'official':

      return finding.uri;

    case 'stackoverflow':

      return `https://stackoverflow.com/search?q=${encodeURIComponent(

        `${finding.name} vulnerability`

      )}`;

    case 'github':

      return `https://github.com/search?q=${encodeURIComponent(

        `${finding.name} security vulnerability`

      )}&type=issues`;

    case 'cve':

      const cveMatch = finding.name.match(/CVE-\d{4}-\d+/i);

      const cveId = cveMatch ? cveMatch[0] : finding.name;

      return `https://nvd.nist.gov/vuln/search/results?form_type=Basic&results_type=overview&query=${encodeURIComponent(

        cveId

      )}`;

    default:

      return finding.uri;

  }

};



// Updated SourceSelector component

const SourceSelector = ({ selectedSources, onSourceToggle, finding }) => (

  <div className="grid grid-cols-2 gap-3">

    {SCRAPING_SOURCES.map((source) => {

      const Icon = source.icon;

      const isSelected = selectedSources.includes(source.id);

      const isDisabled = !source.enabled;

      const sourceUrl = getSourceUrl(source, finding);



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

          <div className={`

            absolute top-2 right-2 w-4 h-4 rounded-full border transition-all duration-200

            flex items-center justify-center

            ${isSelected ? 'bg-blue-600 border-transparent' : 'border-gray-300 bg-white'}

          `}>

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



          {!isDisabled && sourceUrl && (

            <div className="mt-2 pt-2 border-t border-gray-100">

              <a

                href={sourceUrl}

                target="_blank"

                rel="noopener noreferrer"

                onClick={(e) => e.stopPropagation()}

                className="text-xs flex items-center text-gray-500 hover:text-gray-700"

              >

                View on {source.name}

                <ExternalLink className="w-3 h-3 ml-1" />

              </a>

            </div>

          )}

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

  const navigate = useNavigate(); // Add this line here

  const [isScraperRunning, setIsScraperRunning] = useState(false);

  const [scraperError, setScraperError] = useState(null);

  const [isCopied, setIsCopied] = useState(false);

  const [selectedFinding, setSelectedFinding] = useState(null);

  const [selectedSources, setSelectedSources] = useState(['official']);

  const [scrapedResults, setScrapedResults] = useState({});



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

    console.log('Toggling source:', sourceId);

    setSelectedSources((prev) => {

      const newSources = prev.includes(sourceId)

        ? prev.filter((id) => id !== sourceId)

        : [...prev, sourceId];

      console.log('New selected sources:', newSources);

      return newSources;

    });

  };



  // Update handleRunScraper in ImageDetailsModal.jsx

  const handleRunScraper = async (finding) => {

    console.log('Starting scrape with sources:', selectedSources);

    console.log('Finding:', finding);

  

    if (selectedSources.length === 0) {

      setScraperError('Please select at least one source');

      return;

    }

  

    setIsScraperRunning(true);

    setScraperError(null);

    setSelectedFinding(finding);

  

    try {

      let logFileId;

  

      // Handle official documentation scraping

      if (selectedSources.includes('official')) {

        console.log('Starting official documentation scrape...');

        

        if (!finding.uri) {

          console.warn('No URI found for official documentation');

          throw new Error('No vulnerability URI available for official documentation');

        }

  

        const officialResult = await vulnerabilityScraper.scrapeVulnerabilityDetails(finding.uri);

        console.log('Official scraping result:', officialResult);

        

        if (officialResult?.data?.savedAs) {

          // For official docs, the filename might be in data.savedAs

          logFileId = officialResult.data.savedAs.split('.')[0];

        } else if (officialResult?.savedAs) {

          // Direct savedAs property

          logFileId = officialResult.savedAs.split('.')[0];

        }

      }

  

      // Handle StackOverflow scraping

      if (selectedSources.includes('stackoverflow')) {

        console.log('Starting Stack Overflow scrape...');

        const soQuery = `${finding.name} vulnerability`;

        const stackoverflowResult = await vulnerabilityScraper.scrapeStackOverflow(soQuery);

        

        if (stackoverflowResult?.data?.savedAs) {

          logFileId = stackoverflowResult.data.savedAs.split('.')[0];

        } else if (stackoverflowResult?.savedAs) {

          logFileId = stackoverflowResult.savedAs.split('.')[0];

        }

      }

  

      // Close modal and navigate to logs page

      if (logFileId) {

        console.log('Navigating to logs with ID:', logFileId);

        onClose(); // Close the modal

        navigate(`/logs/${logFileId}`); // Navigate to logs page

      } else {

        console.warn('No log file ID found in the scraping result');

        setScraperError('Could not find the log file reference');

      }

  

    } catch (error) {

      console.error('Scraping error:', error);

      setScraperError(`Failed to scrape: ${error.message}`);

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



  // Rest of your existing render code remains the same until the findings map



  return (

    <ModalPortal>

      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-md z-[9999] flex items-center justify-center">

        {/* Your existing modal structure remains the same */}

        <div className="relative bg-white/95 backdrop-blur-xl w-full max-w-4xl max-h-[85vh] rounded-xl shadow-2xl border border-gray-200/50 overflow-hidden mx-4">

          {/* Header */}

          <div className="px-6 py-4 border-b border-gray-200/50">

            {/* Your existing header content */}

          </div>



          {/* Content */}

          <div className="overflow-y-auto p-6 max-h-[calc(85vh-8rem)] space-y-6">

            {/* Your existing content sections */}



            {/* Findings List */}

            <div className="space-y-4">

              {findings.map((finding) => (

                <div

                  key={finding.name}

                  className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 hover:shadow-sm transition-all duration-200"

                >

                  {/* Finding details section */}

                  <div className="flex justify-between items-start mb-4">

                    <h5 className="text-sm font-medium text-gray-900">

                      {finding.name}

                    </h5>

                    {/* Severity badge */}

                  </div>



                  <p className="text-sm text-gray-600 mb-4">

                    {finding.description}

                  </p>



                  {/* Source Selection */}

                  <div className="relative pb-16">

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



                    {/* Stack Overflow Results */}

                    {scrapedResults[finding.name]?.stackoverflow && (

                      <div className="mt-6 bg-orange-50 rounded-lg p-4 border border-orange-200">

                        <div className="flex items-center mb-3">

                          <MessageSquare className="w-5 h-5 text-orange-600" />

                          <h3 className="ml-2 text-lg font-medium text-orange-800">

                            Stack Overflow Results

                          </h3>

                        </div>

                        <div className="space-y-4">

                          {scrapedResults[finding.name].stackoverflow.answers?.map((answer, index) => (

                            <div 

                              key={index} 

                              className="bg-white rounded-lg p-4 shadow-sm border border-orange-100"

                            >

                              <div className="flex justify-between items-center mb-2">

                                <div className="flex items-center">

                                  <span className="text-sm font-medium text-orange-600">

                                    {answer.votes || 0} votes

                                  </span>

                                  {answer.isAccepted && (

                                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center">

                                      <Check className="w-3 h-3 mr-1" />

                                      Accepted

                                    </span>

                                  )}

                                </div>

                              </div>

                              <div className="prose prose-sm max-w-none">

                                <p className="text-gray-700">{answer.text}</p>

                              </div>

                            </div>

                          ))}

                        </div>

                      </div>

                    )}



                    {/* Official Documentation Results */}

                    {scrapedResults[finding.name]?.official && (

                      <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">

                        <div className="flex items-center mb-3">

                          <BookOpen className="w-5 h-5 text-blue-600" />

                          <h3 className="ml-2 text-lg font-medium text-blue-800">

                            Official Documentation

                          </h3>

                        </div>

                        <div className="space-y-4">

                          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">

                            <div className="prose prose-sm max-w-none">

                              <p className="text-gray-700">{

                                scrapedResults[finding.name].official.description ||

                                'No detailed description available.'

                              }</p>

                            </div>

                          </div>

                        </div>

                      </div>

                    )}



                    {/* Analyze Button */}

                    <div className="absolute bottom-0 left-0 right-0 py-3 bg-white/80 backdrop-blur-sm border-t border-gray-200">

                    <button

                      onClick={() => {

                        console.log('Analyze button clicked');

                        handleRunScraper(finding);

                      }}

                      disabled={isScraperRunning || selectedSources.length === 0}

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

                        {isScraperRunning && selectedFinding?.name === finding.name ? (

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



                  {/* Remediation section */}

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



              {/* No findings message */}

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