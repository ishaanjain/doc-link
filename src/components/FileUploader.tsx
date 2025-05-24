import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, X, AlertCircle } from 'lucide-react';
import { FileWithPreview } from '../types';

interface FileUploaderProps {
  onFilesSelected: (files: FileWithPreview[]) => void;
  files: FileWithPreview[];
  maxFiles?: number;
  isLoading?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onFilesSelected, 
  files, 
  maxFiles = 1,
  isLoading = false
}) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    if (acceptedFiles.length > maxFiles) {
      setError(`You can only upload ${maxFiles} file${maxFiles > 1 ? 's' : ''}`);
      return;
    }

    const newFiles = acceptedFiles.map(file => 
      Object.assign(file, {
        preview: URL.createObjectURL(file)
      })
    );

    onFilesSelected(newFiles);
  }, [maxFiles, onFilesSelected]);

  const removeFile = (index: number) => {
    const updatedFiles = [...files];
    
    if (updatedFiles[index].preview) {
      URL.revokeObjectURL(updatedFiles[index].preview!);
    }
    
    updatedFiles.splice(index, 1);
    onFilesSelected(updatedFiles);
  };

  const { 
    getRootProps, 
    getInputProps, 
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: maxFiles,
    disabled: isLoading || files.length >= maxFiles
  });

  const getBorderColor = () => {
    if (isDragAccept) return 'border-green-500';
    if (isDragReject) return 'border-red-500';
    if (isDragActive) return 'border-blue-500';
    return 'border-gray-300';
  };

  return (
    <div className="w-full space-y-4">
      <div 
        {...getRootProps()} 
        className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors duration-200 
          ${getBorderColor()} 
          ${isLoading || files.length >= maxFiles ? 'opacity-50 pointer-events-none' : 'hover:bg-blue-50'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className={`h-12 w-12 ${isDragActive ? 'text-blue-500 animate-bounce' : 'text-blue-400'}`} />
          <p className="text-sm text-gray-600">
            {isDragActive 
              ? 'Drop the PDF file here...' 
              : 'Drag & drop a PDF file here, or click to select'
            }
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <ul className="border rounded-md divide-y divide-gray-200">
            {files.map((file, index) => (
              <li key={index} className="p-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button 
                  onClick={() => removeFile(index)} 
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  disabled={isLoading}
                >
                  <X className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUploader;