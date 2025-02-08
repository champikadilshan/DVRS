// src/components/ai/AIProcessingLogs.jsx
import React from 'react';
import { Terminal, Clock, CheckCircle } from 'lucide-react';

const AIProcessingLogs = ({ logs, isProcessing }) => {
  return (
    <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
      <div className="flex items-center mb-3 text-gray-400">
        <Terminal className="w-4 h-4 mr-2" />
        <span>AI Processing Logs</span>
        {isProcessing && (
          <div className="flex items-center ml-auto">
            <Clock className="w-4 h-4 mr-2 animate-pulse" />
            <span>Processing...</span>
          </div>
        )}
      </div>
      <div className="space-y-2 h-48 overflow-y-auto text-gray-300">
        {logs.map((log, index) => (
          <div 
            key={index} 
            className={`flex items-start ${
              log.type === 'success' ? 'text-green-400' : 
              log.type === 'error' ? 'text-red-400' : 
              'text-gray-300'
            }`}
          >
            <span className="mr-2">
              {log.type === 'success' ? '✓' : '>'}
            </span>
            <span>{log.message}</span>
            {log.timestamp && (
              <span className="ml-auto text-xs text-gray-500">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIProcessingLogs;