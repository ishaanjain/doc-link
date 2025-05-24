import React, { useState } from 'react';
import PDFViewer from './PDFViewer';
import { FileText, AlertCircle, Code, Type } from 'lucide-react';

interface PDFComparisonToolProps {
  isDarkMode?: boolean;
}

const PDFComparisonTool: React.FC<PDFComparisonToolProps> = ({ isDarkMode = false }) => {
  const [leftFile, setLeftFile] = useState<File | null>(null);
  const [rightFile, setRightFile] = useState<File | null>(null);
  const [leftText, setLeftText] = useState<string | null>(null);
  const [rightText, setRightText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConvertingLeft, setIsConvertingLeft] = useState(false);
  const [isConvertingRight, setIsConvertingRight] = useState(false);
  // Add state to store the requirements JSON
  const [requirementsJson, setRequirementsJson] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const file = event.target.files?.[0];
    if (file) {
      if (side === 'left') {
        setLeftFile(file);
        setLeftText(null);
      } else {
        setRightFile(file);
        setRightText(null);
      }
      setError(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, side: 'left' | 'right') => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      if (side === 'left') {
        setLeftFile(file);
        setLeftText(null);
      } else {
        setRightFile(file);
        setRightText(null);
      }
      setError(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const convertLeftToRequirements = async () => {
    if (!leftFile) {
      setError('Please upload the left PDF file first.');
      return;
    }

    setIsConvertingLeft(true);
    setError(null);
  
    try {
      const formData = new FormData();
      formData.append('file', leftFile);
  
      const response = await fetch('http://localhost:8000/api/convert-requirements', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error('Failed to convert PDF to requirements');
      }
  
      const data = await response.json();
      
      // Always expect an array now
      const requirements = data.requirements || [];
      
      // Store the requirements JSON for later use
      setRequirementsJson(JSON.stringify(requirements));
      
      if (requirements.length === 0) {
        setLeftText('No requirements found in the document.');
      } else {
        // Format array as readable text
        const displayText = requirements.map((req: any, index: number) => 
          `${index + 1}. ${req.requirement}\n\nSource: ${req.req_file_txt}\n\n---\n`
        ).join('\n');
        setLeftText(displayText);
      }
    } catch (err) {
      setError('Failed to convert PDF to requirements. Please try again.');
      console.error('Error converting PDF to requirements:', err);
    } finally {
      setIsConvertingLeft(false);
    }
  };

  const matchRightRequirements = async () => {
      if (!rightFile) {
          setError('Please upload the right PDF file first.');
          return;
      }
  
      setIsConvertingRight(true);
      setError(null);
  
      try {
          const formData = new FormData();
          formData.append('file', rightFile);
          
          // Conditionally include requirements_json if available
          if (requirementsJson) {
              formData.append('requirements_json', requirementsJson);
          }
  
          const response = await fetch('http://localhost:8000/api/match-requirements', {
              method: 'POST',
              body: formData,
          });
  
          if (!response.ok) {
              throw new Error('Failed to match requirements');
          }
  
          const data = await response.json();
          setRightText(data.text);
      } catch (err) {
          setError('Failed to match requirements. Please try again.');
          console.error('Error matching requirements:', err);
      } finally {
          setIsConvertingRight(false);
      }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-lg shadow-sm mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">PDF Comparison Tool</h2>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={convertLeftToRequirements}
              disabled={!leftFile || isConvertingLeft}
              className={`px-4 py-2 rounded-md shadow-sm transition-colors flex items-center space-x-2 ${
                !leftFile || isConvertingLeft
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>{isConvertingLeft ? 'Converting...' : 'Extract Requirements'}</span>
            </button>
            <button
              onClick={matchRightRequirements}
              disabled={!rightFile || isConvertingRight}
              className={`px-4 py-2 rounded-md shadow-sm transition-colors flex items-center space-x-2 ${
                !rightFile || isConvertingRight
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>{isConvertingRight ? 'Matching...' : 'Match Requirements'}</span>
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/50 rounded-md flex items-center space-x-2 text-red-600 dark:text-red-400 animate-fade-in">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
        <div className="h-full overflow-hidden">
          <PDFViewer
            file={leftFile}
            onFileChange={(e) => handleFileChange(e, 'left')}
            onDrop={(e) => handleDrop(e, 'left')}
            onDragOver={handleDragOver}
            side="left"
            convertedText={leftText || undefined}
            isDarkMode={isDarkMode}
          />
        </div>
        <div className="h-full overflow-hidden">
          <PDFViewer
            file={rightFile}
            onFileChange={(e) => handleFileChange(e, 'right')}
            onDrop={(e) => handleDrop(e, 'right')}
            onDragOver={handleDragOver}
            side="right"
            convertedText={rightText || undefined}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </div>
  );
};

export default PDFComparisonTool;