import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Loader,
  ChevronDown,
  ChevronRight,
  Globe,
  Search,
  Terminal,
  Link as LinkIcon,
  Info,
  Calendar,
  RefreshCw,
  Brain,
  Upload,
  FileText,
  Wrench,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { aiAnalysisService } from '../../services/ai/aiAnalysisService';
import AIProcessingLogs from '../../components/ai/AIProcessingLogs';

// Drag and Drop Upload Component
const DragDropUpload = ({ selectedFile, onFileSelect, validateFile }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragError, setDragError] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragError(null);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 1) {
      setDragError('Please drop only one file');
      return;
    }

    const file = files[0];
    if (file) {
      if (validateFile(file)) {
        // Create a synthetic event object to match the expected format
        const syntheticEvent = {
          target: {
            files: [file]
          }
        };
        onFileSelect(syntheticEvent);
        setDragError(null);
      } else {
        setDragError('Please drop a valid Dockerfile (Dockerfile, *.dockerfile, *.docker)');
      }
    }
  };

  const handleFileInputChange = (e) => {
    setDragError(null);
    onFileSelect(e);
  };

  return (
    <div className="space-y-2">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : selectedFile 
              ? 'border-green-400 bg-green-50' 
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }
        `}
      >
        <input
          type="file"
          accept=".dockerfile,.docker,dockerfile"
          onChange={handleFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          id="dockerfile-upload"
        />
        
        <div className="space-y-2">
          {selectedFile ? (
            <>
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
              <div>
                <p className="text-sm font-medium text-green-700">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-green-600">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <p className="text-xs text-green-600">
                File ready to upload • Click to change
              </p>
            </>
          ) : isDragOver ? (
            <>
              <Upload className="w-8 h-8 text-blue-500 mx-auto" />
              <p className="text-sm font-medium text-blue-700">
                Drop your Dockerfile here
              </p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Drag & drop your Dockerfile here
                </p>
                <p className="text-xs text-gray-500">
                  or click to browse files
                </p>
              </div>
              <p className="text-xs text-gray-400">
                Supports: Dockerfile, *.dockerfile, *.docker
              </p>
            </>
          )}
        </div>
      </div>

      {/* Traditional File Picker Button (Backup) */}
      <div className="flex justify-center">
        <label htmlFor="dockerfile-upload" className="cursor-pointer">
          <div className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <FileText className="w-4 h-4 mr-2" />
            Browse Files
          </div>
        </label>
      </div>

      {/* Drag Error Display */}
      {dragError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
          <p className="text-sm text-red-800">{dragError}</p>
        </div>
      )}
    </div>
  );
};

const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Icon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 py-3 border-t border-gray-100 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

const InfoCard = ({ icon: Icon, title, value }) => (
  <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
    <div className="flex items-center space-x-2 text-gray-500 mb-1">
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium">{title}</span>
    </div>
    <p className="text-sm font-medium text-gray-900">{value || 'N/A'}</p>
  </div>
);

// New component for Dockerfile fixing
const DockerfileFixer = ({ logs }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState(null);
  const [error, setError] = useState(null);

  const extractCVEs = (logs) => {
    const cves = [];
    const cvePattern = /CVE-\d{4}-\d+/gi;
    
    // Extract from search query (most common for Stack Overflow scrapes)
    if (logs?.searchQuery) {
      const searchCVEs = logs.searchQuery.match(cvePattern) || [];
      cves.push(...searchCVEs);
    }
    
    // Extract from metadata search query
    if (logs?.metadata?.searchQuery) {
      const metaCVEs = logs.metadata.searchQuery.match(cvePattern) || [];
      cves.push(...metaCVEs);
    }
    
    // Try to extract from findings in data
    if (logs?.data?.findings) {
      logs.data.findings.forEach(finding => {
        const foundCVEs = finding.name?.match(cvePattern) || [];
        cves.push(...foundCVEs);
        
        if (finding.description) {
          const descCVEs = finding.description.match(cvePattern) || [];
          cves.push(...descCVEs);
        }
      });
    }

    // Extract from title or any text content
    if (logs?.data?.title) {
      const titleCVEs = logs.data.title.match(cvePattern) || [];
      cves.push(...titleCVEs);
    }

    // Extract from answers if it's Stack Overflow data
    if (logs?.data?.answers) {
      logs.data.answers.forEach(answer => {
        if (answer.text) {
          const answerCVEs = answer.text.match(cvePattern) || [];
          cves.push(...answerCVEs);
        }
      });
    }

    // Also try from AI analysis results if available
    if (logs?.analysis) {
      const analysisCVEs = logs.analysis.match(cvePattern) || [];
      cves.push(...analysisCVEs);
    }

    // Extract from any raw OCR text
    if (logs?.data?.rawOcrText) {
      const ocrCVEs = logs.data.rawOcrText.match(cvePattern) || [];
      cves.push(...ocrCVEs);
    }

    // Extract from source URL if it contains CVE
    if (logs?.sourceUrl) {
      const urlCVEs = logs.sourceUrl.match(cvePattern) || [];
      cves.push(...urlCVEs);
    }

    if (logs?.metadata?.sourceUrl) {
      const metaUrlCVEs = logs.metadata.sourceUrl.match(cvePattern) || [];
      cves.push(...metaUrlCVEs);
    }

    // Remove duplicates and return
    return [...new Set(cves)];
  };

  const validateDockerfile = (file) => {
    const fileName = file.name.toLowerCase();
    const validNames = ['dockerfile', 'dockerfile.txt'];
    const validExtensions = ['.dockerfile', '.docker'];
    
    return validNames.includes(fileName) || 
           validExtensions.some(ext => fileName.endsWith(ext)) ||
           fileName.startsWith('dockerfile');
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (validateDockerfile(file)) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please select a valid Dockerfile (Dockerfile, *.dockerfile, *.docker)');
        setSelectedFile(null);
        // Clear the input value to allow re-selection
        event.target.value = '';
      }
    }
  };

  const handleFixDockerfile = async () => {
    if (!selectedFile) {
      setError('Please select a Dockerfile first');
      return;
    }

    setIsFixing(true);
    setError(null);
    setFixResult(null);

    try {
      // Read the Dockerfile content
      const fileContent = await selectedFile.text();
      
      // Extract CVEs from logs
      const cves = extractCVEs(logs);
      
      if (cves.length === 0) {
        setError('No CVEs found in the analysis to fix');
        setIsFixing(false);
        return;
      }

      // Prepare the prompt
      const prompt = `${fileContent.trim()} , This docker file have these CVEs [${cves.join(', ')}] , can you fix it and give me the updated docker file ?`;

      // Send request directly to your Python API
      const response = await axios.post('http://localhost:8001/api/query', {
        prompt: prompt,
        user_id: 'postman-test'
      });

      setFixResult({
        success: true,
        message: 'Dockerfile fixed successfully!',
        cves: cves,
        response: response.data
      });

    } catch (err) {
      console.error('Error fixing Dockerfile:', err);
      setError(`Failed to fix Dockerfile: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsFixing(false);
    }
  };

  const cves = extractCVEs(logs);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Wrench className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900">Fix Dockerfile</span>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* CVE Information */}
        {cves.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Found CVEs to fix: {cves.length}
            </h4>
            <div className="flex flex-wrap gap-1">
              {cves.map((cve, index) => (
                <span 
                  key={index}
                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                >
                  {cve}
                </span>
              ))}
            </div>
          </div>
        )}

        {cves.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              No CVEs found in the current analysis. The fix might not be specific to vulnerabilities.
            </p>
          </div>
        )}

        {/* File Upload with Drag & Drop */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Upload Dockerfile
          </label>
          <DragDropUpload 
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            validateFile={validateDockerfile}
          />
        </div>

        {/* Fix Button */}
        <button
          onClick={handleFixDockerfile}
          disabled={!selectedFile || isFixing}
          className={`
            w-full flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
            ${selectedFile && !isFixing
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isFixing ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Fixing Dockerfile...
            </>
          ) : (
            <>
              <Wrench className="w-4 h-4 mr-2" />
              Fix Dockerfile
            </>
          )}
        </button>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Success Display */}
        {fixResult && fixResult.success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <p className="text-sm font-medium text-green-800">{fixResult.message}</p>
            </div>
            <p className="text-xs text-green-700">
              Fixed {fixResult.cves.length} CVE(s): {fixResult.cves.join(', ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const ScrapingLogsPage = () => {
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [processingLogs, setProcessingLogs] = useState([]);
  const [showProcessingLogs, setShowProcessingLogs] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/logs/${id}`);
        setLogs(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (id) {
      fetchLogs();
    }
  }, [id]);

  const handleAIAnalysis = async () => {
    setAnalyzing(true);
    setShowProcessingLogs(true);
    setProcessingLogs([{
      type: 'info',
      message: 'Analyzing Data with AI...',
      timestamp: new Date()
    }]);

    try {
      const response = await aiAnalysisService.analyzeVulnerabilities(id, logs);
      
      if (response.logs) {
        setProcessingLogs(prev => [...prev, ...response.logs]);
      }

      setAiResult({
        analysis: response.analysis,
        technicalLogs: response.technicalLogs
      });

      setProcessingLogs(prev => [...prev, {
        type: 'success',
        message: 'Webscraping completed successfully',
        timestamp: new Date()
      }]);
    } catch (err) {
      setProcessingLogs(prev => [...prev, {
        type: 'error',
        message: `Error: ${err.message}`,
        timestamp: new Date()
      }]);
      setError('AI Analysis failed: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    return duration < 1000 
      ? `${duration}ms` 
      : `${(duration / 1000).toFixed(2)}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-600">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error Loading Analysis</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="mt-3 px-3 py-1.5 bg-white border border-red-300 rounded-md text-sm text-red-700 hover:bg-red-50 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = logs?.data?.success !== false && !logs?.error;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-full mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-3 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-500" />
              </button>
              <div>
                <h1 className="text-sm font-medium text-gray-900">Analysis Results</h1>
                <p className="text-xs text-gray-500">Vulnerability Assessment</p>
              </div>
            </div>

            <button
              onClick={handleAIAnalysis}
              disabled={analyzing}
              className="text-sm inline-flex items-center px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Running AI Analysis
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze with AI
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-6 py-4 space-y-4">
        <div className={`px-4 py-3 rounded-lg border ${
          isSuccess 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center">
            {isSuccess ? (
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
            )}
            <div>
              <h2 className={`text-sm font-medium ${
                isSuccess ? 'text-green-800' : 'text-red-800'
              }`}>
                {isSuccess ? 'Analysis Completed Successfully' : 'Analysis Failed'}
              </h2>
              <p className={`text-xs mt-0.5 ${
                isSuccess ? 'text-green-700' : 'text-red-700'
              }`}>
                {isSuccess 
                  ? 'All vulnerability information has been successfully collected and analyzed.'
                  : 'Some issues were encountered during the analysis process.'}
              </p>
            </div>
          </div>
        </div>

        {showProcessingLogs && (
          <div className="mb-6">
            <AIProcessingLogs 
              logs={processingLogs}
              isProcessing={analyzing}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCard 
            icon={Globe}
            title="Source Type"
            value={logs?.data?.source || 'Official Documentation'}
          />
          <InfoCard 
            icon={Clock}
            title="Processing Time"
            value={formatDuration(logs?.data?.processingTime)}
          />
          <InfoCard 
            icon={Calendar}
            title="Scan Date"
            value={formatTimestamp(logs?.metadata?.scrapeDate)}
          />
          <InfoCard 
            icon={Search}
            title="Results Found"
            value={logs?.data?.resultsCount}
          />
        </div>

        {aiResult && (
          <CollapsibleSection 
            title="AI Analysis Results" 
            icon={Brain}
            defaultOpen={true}
          >
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap font-mono text-xs">
                  {aiResult.analysis}
                </div>
              </div>
              
              {aiResult.technicalLogs && (
                <div className="mt-4 border-t border-purple-200 pt-4">
                  <h4 className="text-sm font-medium text-purple-900 mb-2">
                    Processing Details
                  </h4>
                  <div className="bg-white rounded-lg p-3">
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <dt className="text-gray-500">Model:</dt>
                      <dd className="text-gray-900">{aiResult.technicalLogs.modelInfo}</dd>
                      
                      <dt className="text-gray-500">Processing Time:</dt>
                      <dd className="text-gray-900">
                        {(aiResult.technicalLogs.processingTime / 1000).toFixed(2)}s
                      </dd>
                      
                      <dt className="text-gray-500">Tokens Generated:</dt>
                      <dd className="text-gray-900">{aiResult.technicalLogs.tokenCount}</dd>
                      
                      <dt className="text-gray-500">Prompt Tokens:</dt>
                      <dd className="text-gray-900">{aiResult.technicalLogs.promptTokens}</dd>
                    </dl>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-4">
            <CollapsibleSection 
              title="Metadata" 
              icon={Info}
              defaultOpen={true}
            >
              <div className="space-y-2">
                {Object.entries(logs?.metadata || {}).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded px-3 py-2">
                    <p className="text-xs text-gray-500">{key}</p>
                    <p className="text-xs font-medium text-gray-900 break-all">
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </p>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection 
              title="Source URLs" 
              icon={LinkIcon}
              defaultOpen={true}
            >
              <div className="space-y-2">
                {logs?.sourceUrl && (
                  <a
                    href={logs.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center break-all"
                  >
                    <Globe className="w-3 h-3 mr-1 flex-shrink-0" />
                    {logs.sourceUrl}
                  </a>
                )}
              </div>
            </CollapsibleSection>

            {/* NEW: Add Dockerfile Fixer below Source URLs */}
            <DockerfileFixer logs={logs} />
          </div>

          <div className="lg:col-span-2 space-y-4">
            {/* Streamlit App Iframe */}
            <CollapsibleSection 
              title="CVE Expert Chat - Live Analysis" 
              icon={Terminal}
              defaultOpen={true}
            >
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Streamlit App Running</span>
                  </div>
                  <a
                    href="http://localhost:8502/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    Open in new tab
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <iframe
                    src="http://localhost:8502/"
                    className="w-full h-[700px] border-0" 
                    title="CVE Expert Streamlit App"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-top-navigation"
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  You can interact with the CVE Expert directly in this embedded view, or open it in a new tab for full screen experience.
                </div>
              </div>
            </CollapsibleSection>

            {logs?.data?.findings && (
              <CollapsibleSection 
                title="Findings" 
                icon={Search}
                defaultOpen={true}
              >
                <div className="space-y-2">
                  {logs.data.findings.map((finding, index) => (
                    <div key={index} className="bg-gray-50 rounded px-3 py-2">
                      <h4 className="text-xs font-medium text-gray-900">
                        {finding.title || finding.name}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {finding.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            <CollapsibleSection 
              title="Raw Data" 
              icon={Terminal}
            >
              <div className="bg-gray-50 rounded-lg p-3 overflow-x-auto">
                <pre className="text-xs text-gray-800">
                  <code>{JSON.stringify(logs, null, 2)}</code>
                </pre>
              </div>
            </CollapsibleSection>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrapingLogsPage;