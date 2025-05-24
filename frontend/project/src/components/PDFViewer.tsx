import React, { useState, useEffect, useRef } from 'react';
import { FileUp, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText } from 'lucide-react';
import LoadingSpinner from './ui/LoadingSpinner';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  file: File | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  side: 'left' | 'right';
  convertedText?: string;
  isDarkMode?: boolean;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  onFileChange,
  onDrop,
  onDragOver,
  side,
  convertedText,
  isDarkMode = false
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [showText, setShowText] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load PDF document when file changes
  useEffect(() => {
    if (file) {
      loadPDF(file);
      setPageNumber(1);
      setScale(1.0);
      setShowText(false);
      setError(null);
    } else {
      setPdfDocument(null);
      setNumPages(null);
      setPageNumber(1);
      setScale(1.0);
      setShowText(false);
      setError(null);
    }
  }, [file]);

  // Render page when page number or scale changes
  useEffect(() => {
    if (pdfDocument && !showText) {
      renderPage(pageNumber);
    }
  }, [pdfDocument, pageNumber, scale, showText]);

  const loadPDF = async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDocument(pdf);
      setNumPages(pdf.numPages);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Failed to load the PDF. Please try another file.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPage = async (pageNum: number) => {
    if (!pdfDocument || !canvasRef.current) return;
    
    try {
      const page = await pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      
      await page.render(renderContext).promise;

      // Extract text content with better coordinate handling
      const textContent = await page.getTextContent();
      let fullText = '';
      const textItems: Array<{text: string, x: number, y: number, width: number, height: number}> = [];
  
      // Build text items with proper positioning
      for (const item of textContent.items) {
        if ('str' in item && item.str.trim()) {
          const transform = item.transform;
          const x = transform[4];
          const y = transform[5];
          const textWidth = item.width || 0;
          const textHeight = item.height || 12;
          
          const normalizedText = item.str
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          textItems.push({
            text: normalizedText,
            x: x,
            y: y,
            width: textWidth,
            height: textHeight
          });
          
          // Add space between items if needed
          if (fullText && normalizedText && !fullText.endsWith(' ') && !normalizedText.startsWith(' ')) {
            fullText += ' ';
          }
          fullText += normalizedText;
        }
      }
  
      // Additional normalization for the concatenated full text
      fullText = fullText
        .replace(/\n/g, ' ')     // Replace any remaining newlines with spaces
        .replace(/\s+/g, ' ')   // Replace multiple spaces with single space
        .trim();                // Remove leading/trailing whitespace
  
      // Highlight target text
      const targetStr = 'This document requires that a process be established to develop and manage verification requirements to assure that launch and space equipment can function correctly and withstand stresses it may encounter during its life cycle including end-of-life performance requirements.';
      console.log("🚨🚨🚨🚨")
      console.log(fullText.toLowerCase())
      const targetIndex = fullText.toLowerCase().indexOf(targetStr.toLowerCase());
      
      if (targetIndex !== -1) {
        console.log("we found the target string")
        // Find which text items contain our target string
        let currentIndex = 0;
        let startItem = null;
        let endItem = null;
        
        for (let i = 0; i < textItems.length; i++) {
          const item = textItems[i];
          const itemStart = currentIndex;
          const itemEnd = currentIndex + item.text.length;
          
          if (targetIndex >= itemStart && targetIndex < itemEnd && !startItem) {
            startItem = { item, offset: targetIndex - itemStart };
          }
          
          if (targetIndex + targetStr.length > itemStart && targetIndex + targetStr.length <= itemEnd && !endItem) {
            endItem = { item, offset: targetIndex + targetStr.length - itemStart };
          }
          
          currentIndex += item.text.length;
          
          if (startItem && endItem) break;
        }
        
        if (startItem && endItem) {
          // Calculate highlight rectangle
          const startX = startItem.item.x;
          const startY = viewport.height - startItem.item.y; // Convert to canvas coordinates
          const endX = endItem.item.x + (endItem.offset / endItem.item.text.length) * endItem.item.width;
          const height = Math.max(startItem.item.height, 12); // Minimum height
          
          context.fillStyle = 'rgba(255, 255, 0, 0.4)';
          context.fillRect(
            startX,
            startY - height, // Adjust for text baseline
            endX - startX,
            height
          );
          console.log("there's a start and end item")
        }
      }
    } catch (err) {
      console.error('Error rendering page:', err);
      setError('Failed to render the page.');
    }
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
                <div className="flex justify-center items-center h-full">
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : error ? (
                    <div className="text-center p-6 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/50 rounded-lg">
                      {error}
                    </div>
                  ) : (
                    <canvas 
                      ref={canvasRef}
                      className="mx-auto shadow-lg max-w-full h-auto"
                      style={{ maxHeight: '100%' }}
                    />
                  )}
                </div>
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