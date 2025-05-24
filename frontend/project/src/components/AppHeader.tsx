import React from 'react';
import { SplitSquareVertical } from 'lucide-react';

const AppHeader: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 flex items-center">
        <div className="flex items-center">
          <SplitSquareVertical className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800">SpecMatch: PDF Comparison Tool</h1>
        </div>
        <div className="ml-auto">
          <span className="text-sm text-gray-500">Compare PDFs side by side</span>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;