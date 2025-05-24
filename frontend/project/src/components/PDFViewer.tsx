import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FileUp, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText } from 'lucide-react';
import LoadingSpinner from './ui/LoadingSpinner';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Set the worker source for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  file: File | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  side: 'left' | 'right';
  convertedText?: string;
  isDarkMode?: boolean;
  onHighlightClick?: (text: string) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  onFileChange,
  onDrop,
  onDragOver,
  side,
  convertedText,
  isDarkMode = false,
  onHighlightClick
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [showText, setShowText] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [sourceTexts, setSourceTexts] = useState<string[]>([]);
  const [currentFileId, setCurrentFileId] = useState<string>('');

  // Reset state when file changes
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      const newFileId = `${file.name}-${Date.now()}`; // Create unique ID for the file
      setFileUrl(url);
      setCurrentFileId(newFileId);
      setPageNumber(1);
      setScale(1.0);
      setShowText(false);
      setError(null);
      setSourceTexts([]);
      setNumPages(null);
      return () => {
        URL.revokeObjectURL(url);
        setSourceTexts([]);
      };
    } else {
      setFileUrl(null);
      setCurrentFileId('');
      setNumPages(null);
      setPageNumber(1);
      setScale(1.0);
      setShowText(false);
      setError(null);
      setSourceTexts([]);
    }
  }, [file]);

  // Extract source texts when convertedText changes
  useEffect(() => {
    if (convertedText && currentFileId) {
      const sources = convertedText
        .split('\n\nSource: ')
        .slice(1)
        .map(text => text.split('\n\n---')[0].trim());
      setSourceTexts(sources);
    } else {
      setSourceTexts([]);
    }
  }, [convertedText, currentFileId]);

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
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return Math.min(Math.max(1, newPageNumber), numPages || 1);
    });
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.0));
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

  const handleHighlightClick = (text: string) => {
    if (onHighlightClick) {
      onHighlightClick(text);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className={`bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between flex-shrink-0`}>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          <FileText className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
          {side === 'left' ? 'Left Document' : 'Right Document'}
          {file && (
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
              ({file.name})
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {file && (
            <>
              <button 
                onClick={zoomOut} 
                className="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-sm"
                aria-label="Zoom out"
              >
                <ZoomOut size={16} className="text-gray-600 dark:text-gray-300" />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button 
                onClick={zoomIn} 
                className="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-sm"
                aria-label="Zoom in"
              >
                <ZoomIn size={16} className="text-gray-600 dark:text-gray-300" />
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className={`flex-grow overflow-auto relative transition-colors duration-200 ${
          isDragging ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-900/50'
        }`}
        onDrop={handleDrop}
        onDragOver={onDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {file ? (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm flex-shrink-0">
              <div className="flex items-center space-x-2">
                <button
                  onClick={previousPage}
                  disabled={pageNumber <= 1}
                  className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:hover:bg-white dark:disabled:hover:bg-gray-700"
                >
                  <ChevronLeft size={16} className="text-gray-600 dark:text-gray-300" />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Page {pageNumber} of {numPages || '--'}
                </span>
                <button
                  onClick={nextPage}
                  disabled={pageNumber >= (numPages || 1)}
                  className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:hover:bg-white dark:disabled:hover:bg-gray-700"
                >
                  <ChevronRight size={16} className="text-gray-600 dark:text-gray-300" />
                </button>
              </div>
              {convertedText && (
                <button
                  onClick={() => setShowText(!showText)}
                  className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center space-x-1"
                >
                  <FileText size={16} className="text-gray-600 dark:text-gray-300" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {showText ? 'Show PDF' : 'Show Text'}
                  </span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-auto p-4">
              {showText ? (
                <div className="whitespace-pre-wrap font-mono text-sm bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm text-gray-800 dark:text-gray-200">
                  {convertedText}
                </div>
              ) : (
                <Document
                  file={fileUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex justify-center items-center h-full">
                      <LoadingSpinner />
                    </div>
                  }
                  error={
                    <div className="text-center p-6 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/50 rounded-lg">
                      {error || 'Failed to load PDF.'}
                    </div>
                  }
                >
                  <Page 
                    pageNumber={pageNumber} 
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="mx-auto shadow-lg"
                    customTextRenderer={({ str, itemIndex }) => {
                      // Only highlight non-empty text that matches the source, excluding periods and single letters with periods
                      const isHighlighted = str.trim() !== '' && 
                        str !== '.' && 
                        !/^[a-z]\.$/i.test(str) && 
                        sourceTexts.some(source => 
                          str.includes(source) || source.includes(str)
                        );
                      if (isHighlighted) {
                        return `<span style="background-color: yellow; opacity: 0.5; cursor: pointer;" onclick="window.handleHighlightClick('${str.replace(/'/g, "\\'")}')">${str}</span>`;
                      }
                      return str;
                    }}
                  />
                </Document>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className={`p-8 rounded-lg border-2 border-dashed transition-colors duration-200 ${
              isDragging 
                ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
            }`}>
              <FileUp className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4 mx-auto" />
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Upload PDF</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Drag and drop a PDF file here, or click the button below to browse
              </p>
              <label className="inline-flex items-center px-4 py-2 border border-blue-500 dark:border-blue-400 rounded-md shadow-sm text-sm font-medium text-blue-500 dark:text-blue-400 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors">
                Select PDF
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={onFileChange}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;