import React, { useState } from 'react';
import PDFViewer from './PDFViewer';
import { FileText, AlertCircle } from 'lucide-react';

interface PDFComparisonToolProps {
  isDarkMode?: boolean;
}

const PDFComparisonTool: React.FC<PDFComparisonToolProps> = ({ isDarkMode = false }) => {
  const [leftFile, setLeftFile] = useState<File | null>(null);
  const [rightFile, setRightFile] = useState<File | null>(null);
  const [leftText, setLeftText] = useState<string | null>(null);
  const [rightText, setRightText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

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

  const convertToText = async () => {
    if (!leftFile || !rightFile) {
      setError('Please upload both PDF files first.');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('left_file', leftFile);
      formData.append('right_file', rightFile);

      const response = await fetch('http://localhost:8000/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to convert PDFs');
      }

      const data = await response.json();
      setLeftText(data.left_text);
      setRightText(data.right_text);
    } catch (err) {
      setError('Failed to convert PDFs. Please try again.');
      console.error('Error converting PDFs:', err);
    } finally {
      setIsConverting(false);
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
          <button
            onClick={convertToText}
            disabled={!leftFile || !rightFile || isConverting}
            className={`px-4 py-2 rounded-md shadow-sm transition-colors ${
              !leftFile || !rightFile || isConverting
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isConverting ? 'Converting...' : 'Convert to Text'}
          </button>
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