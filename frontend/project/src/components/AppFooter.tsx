import React from 'react';

const AppFooter: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4">
      <div className="container mx-auto px-4 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} PDF Comparison Tool</p>
      </div>
    </footer>
  );
};

export default AppFooter;