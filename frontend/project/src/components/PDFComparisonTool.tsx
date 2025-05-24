import React, { useState } from 'react';
import PDFViewer from './PDFViewer';
import { FileUp, Info, Upload, FileText, AlertCircle } from 'lucide-react';
import axios from 'axios';

const PDFComparisonTool: React.FC = () => {
  const [leftPdfFile, setLeftPdfFile] = useState<File | null>(null);
  const [rightPdfFile, setRightPdfFile] = useState<File | null>(null);
  const [infoVisible, setInfoVisible] = useState(true);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedTexts, setConvertedTexts] = useState<{ left?: string; right?: string }>({});
  const [error, setError] = useState<string | null>(null);

  const handleLeftFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setLeftPdfFile(event.target.files[0]);
      setError(null);
    }
  };

  const handleRightFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setRightPdfFile(event.target.files[0]);
      setError(null);
    }
  };

  const handleLeftDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setLeftPdfFile(event.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleRightDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setRightPdfFile(event.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const closeInfo = () => {
    setInfoVisible(false);
  };

  const handleConvert = async () => {
    if (!leftPdfFile && !rightPdfFile) return;

    setIsConverting(true);
    setError(null);
    const formData = new FormData();
    if (leftPdfFile) formData.append('pdfs', leftPdfFile);
    if (rightPdfFile) formData.append('pdfs', rightPdfFile);

    try {
      const response = await axios.post('http://localhost:8000/api/convert', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const results = response.data.results;
        const newConvertedTexts: { left?: string; right?: string } = {};
        
        if (leftPdfFile && results[0]) {
          newConvertedTexts.left = results[0].textContent;
        }
        if (rightPdfFile && results[1]) {
          newConvertedTexts.right = results[1].textContent;
        }
        
        setConvertedTexts(newConvertedTexts);
      }
    } catch (error) {
      console.error('Error converting PDFs:', error);
      setError('Error converting PDFs. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {infoVisible && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 flex items-start shadow-sm transition-all duration-300 hover:shadow-md">
          <Info className="text-blue-500 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-grow">
            <h3 className="font-medium text-blue-800 mb-1">How to use this tool</h3>
            <p className="text-blue-700 text-sm">
              Upload PDFs to both panels using the file buttons or drag and drop. 
              You can then scroll each PDF independently to compare content. 
              Each viewer supports zooming and navigation controls.
            </p>
          </div>
          <button 
            onClick={closeInfo}
            className="text-blue-500 hover:text-blue-700 ml-3 transition-colors duration-200"
            aria-label="Close info"
          >
            &times;
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start animate-fade-in">
          <AlertCircle className="text-red-500 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-16rem)]">
        {/* Left PDF Panel */}
        <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
          <PDFViewer 
            file={leftPdfFile} 
            onFileChange={handleLeftFileChange} 
            onDrop={handleLeftDrop} 
            onDragOver={handleDragOver} 
            side="left"
            convertedText={convertedTexts.left}
          />
        </div>

        {/* Right PDF Panel */}
        <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
          <PDFViewer 
            file={rightPdfFile} 
            onFileChange={handleRightFileChange} 
            onDrop={handleRightDrop} 
            onDragOver={handleDragOver} 
            side="right"
            convertedText={convertedTexts.right}
          />
        </div>
      </div>

      {/* Convert Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleConvert}
          disabled={isConverting || (!leftPdfFile && !rightPdfFile)}
          className={`flex items-center px-6 py-3 rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105 ${
            isConverting || (!leftPdfFile && !rightPdfFile)
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {isConverting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Converting...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5 mr-2" />
              Convert to Text
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PDFComparisonTool;