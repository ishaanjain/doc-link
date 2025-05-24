import React from 'react';
import { FileText, RefreshCw } from 'lucide-react';

interface ProcessingIndicatorProps {
  isProcessing: boolean;
}

const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({ isProcessing }) => {
  if (!isProcessing) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-md mx-auto flex flex-col items-center space-y-4">
        <div className="relative">
          <FileText className="h-16 w-16 text-blue-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 text-blue-700 animate-spin" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900">Processing PDFs</h3>
        <p className="text-sm text-gray-500 text-center">
          Converting your PDF files to text. This may take a moment depending on the file size and complexity.
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full animate-pulse w-full"></div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingIndicator;