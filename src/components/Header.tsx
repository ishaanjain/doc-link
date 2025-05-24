import React from 'react';
import { FileText } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-4 px-6 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-8 w-8" />
          <h1 className="text-2xl font-bold">PDF to Text Converter</h1>
        </div>
        <div className="text-sm hidden md:block">
          Convert PDF documents to text for analysis
        </div>
      </div>
    </header>
  );
};

export default Header;