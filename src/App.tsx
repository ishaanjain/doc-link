import React, { useState } from 'react';
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import TextPreview from './components/TextPreview';
import ProcessingIndicator from './components/ProcessingIndicator';
import { FileWithPreview, ConversionResult } from './types';
import { convertPdfsToText } from './services/api';
import { AlertCircle } from 'lucide-react';

function App() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = (selectedFiles: FileWithPreview[]) => {
    setFiles(selectedFiles);
    setResults([]);
    setError(null);
  };

  const handleConversion = async () => {
    if (files.length === 0) {
      setError('Please select at least one PDF file to convert');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await convertPdfsToText(files);
      setResults(response.results);
    } catch (err: any) {
      setError(err.message || 'An error occurred during conversion');
      console.error('Conversion error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 gap-6">
          {[0, 1].map((index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">PDF Document {index + 1}</h2>
              <FileUploader 
                onFilesSelected={(selectedFiles) => {
                  const newFiles = [...files];
                  newFiles[index] = selectedFiles[0];
                  handleFilesSelected(newFiles.filter(Boolean));
                }}
                files={files.filter((_, i) => i === index)}
                maxFiles={1}
                isLoading={isProcessing}
              />
              
              {results[index] && (
                <div className="mt-6">
                  <TextPreview result={results[index]} />
                </div>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleConversion}
            disabled={files.length === 0 || isProcessing}
            className={`px-8 py-3 rounded-md font-medium transition-all duration-200 
              ${files.length === 0 ? 
                'bg-gray-200 text-gray-500 cursor-not-allowed' : 
                'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow'
              }
            `}
          >
            Convert to Text
          </button>
        </div>
      </main>
      
      <footer className="bg-white border-t py-4 px-6">
        <div className="container mx-auto text-center text-sm text-gray-500">
          PDF to Text Converter &copy; {new Date().getFullYear()}
        </div>
      </footer>
      
      <ProcessingIndicator isProcessing={isProcessing} />
    </div>
  );
}

export default App;