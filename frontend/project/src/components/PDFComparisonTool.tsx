import React, { useState } from 'react';
import PDFViewer from './PDFViewer';
import { FileUp, Info } from 'lucide-react';

const PDFComparisonTool: React.FC = () => {
  const [leftPdfFile, setLeftPdfFile] = useState<File | null>(null);
  const [rightPdfFile, setRightPdfFile] = useState<File | null>(null);
  const [infoVisible, setInfoVisible] = useState(true);

  const handleLeftFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setLeftPdfFile(event.target.files[0]);
    }
  };

  const handleRightFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setRightPdfFile(event.target.files[0]);
    }
  };

  const handleLeftDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setLeftPdfFile(event.dataTransfer.files[0]);
    }
  };

  const handleRightDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setRightPdfFile(event.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const closeInfo = () => {
    setInfoVisible(false);
  };

  return (
    <div className="container mx-auto">
      {infoVisible && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
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
            className="text-blue-500 hover:text-blue-700 ml-3"
            aria-label="Close info"
          >
            &times;
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-12rem)]">
        {/* Left PDF Panel */}
        <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden bg-white">
          <PDFViewer 
            file={leftPdfFile} 
            onFileChange={handleLeftFileChange} 
            onDrop={handleLeftDrop} 
            onDragOver={handleDragOver} 
            side="left"
          />
        </div>

        {/* Right PDF Panel */}
        <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden bg-white">
          <PDFViewer 
            file={rightPdfFile} 
            onFileChange={handleRightFileChange} 
            onDrop={handleRightDrop} 
            onDragOver={handleDragOver} 
            side="right"
          />
        </div>
      </div>
    </div>
  );
};

export default PDFComparisonTool;