import React, { useState } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { ConversionResult } from '../types';

interface TextPreviewProps {
  result: ConversionResult;
}

const TextPreview: React.FC<TextPreviewProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(result.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleDownload = () => {
    const blob = new Blob([result.textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.originalName.replace('.pdf', '.txt');
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="border rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
      <div className="bg-gray-50 p-3 border-b flex items-center justify-between">
        <h3 className="font-medium truncate max-w-[200px]" title={result.originalName}>
          {result.originalName}
        </h3>
        <div className="flex space-x-2">
          <button 
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-gray-200 transition-colors"
            title="Copy text"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-gray-500" />
            )}
          </button>
          <button 
            onClick={handleDownload}
            className="p-1.5 rounded-md hover:bg-gray-200 transition-colors"
            title="Download text file"
          >
            <Download className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
      <div className="p-4 flex-1 overflow-auto bg-white">
        <pre className="text-sm whitespace-pre-wrap font-mono text-gray-700 h-full">
          {result.textContent || "No text content available"}
        </pre>
      </div>
    </div>
  );
};

export default TextPreview;