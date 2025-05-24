import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FileUp, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import LoadingSpinner from './ui/LoadingSpinner';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Set the worker source for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  file: File | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  side: 'left' | 'right';
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file, onFileChange, onDrop, onDragOver, side }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load the PDF. Please try another file.');
  };

  const changePage = (offset: number) => {
    if (numPages) {
      const newPage = pageNumber + offset;
      if (newPage >= 1 && newPage <= numPages) {
        setPageNumber(newPage);
      }
    }
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));

  const handleDragEnter = () => {
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(false);
    onDrop(e);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-50 border-b border-gray-200 p-3 flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">
          {side === 'left' ? 'Left Document' : 'Right Document'}
        </div>
        <div className="flex items-center space-x-2">
          {file && (
            <>
              <button 
                onClick={zoomOut} 
                className="p-1 rounded-md hover:bg-gray-200 transition-colors"
                aria-label="Zoom out"
              >
                <ZoomOut size={16} />
              </button>
              <button 
                onClick={zoomIn} 
                className="p-1 rounded-md hover:bg-gray-200 transition-colors"
                aria-label="Zoom in"
              >
                <ZoomIn size={16} />
              </button>
              <div className="text-sm text-gray-500">
                {Math.round(scale * 100)}%
              </div>
            </>
          )}
        </div>
      </div>

      <div 
        className={`flex-grow overflow-auto relative ${isDragging ? 'bg-blue-50' : ''}`}
        onDrop={handleDrop}
        onDragOver={onDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {file ? (
          <div className="min-h-full">
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}
              error={<div className="text-center p-6 text-red-500">{error || 'Failed to load PDF.'}</div>}
            >
              <Page 
                pageNumber={pageNumber} 
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="mx-auto"
              />
            </Document>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <FileUp className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Upload PDF</h3>
            <p className="text-sm text-gray-500 mb-4">
              Drag and drop a PDF file here, or click the button below to browse
            </p>
            <label className="inline-flex items-center px-4 py-2 border border-blue-500 rounded-md shadow-sm text-sm font-medium text-blue-500 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors">
              Select PDF
              <input
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={onFileChange}
              />
            </label>
          </div>
        )}
      </div>
      
      {file && numPages && (
        <div className="bg-gray-50 border-t border-gray-200 p-3 flex items-center justify-between">
          <div className="text-xs text-gray-500 truncate max-w-[150px]">
            {file.name}
          </div>
          <div className="flex items-center">
            <button 
              onClick={previousPage} 
              disabled={pageNumber <= 1}
              className="p-1 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm mx-2">
              {pageNumber} / {numPages}
            </span>
            <button 
              onClick={nextPage} 
              disabled={pageNumber >= numPages}
              className="p-1 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;