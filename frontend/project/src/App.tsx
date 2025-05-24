import React, { useState, useEffect } from 'react';
import { Suspense, lazy } from 'react';
import AppHeader from './components/AppHeader';
import AppFooter from './components/AppFooter';
import LoadingSpinner from './components/ui/LoadingSpinner';
import PDFComparisonTool from './components/PDFComparisonTool';
import { Moon, Sun } from 'lucide-react';

// Lazy load the PDFComparisonTool to improve initial load performance
const PDFComparisonToolLazy = lazy(() => import('./components/PDFComparisonTool'));

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-gray-700" />
          )}
        </button>
      </div>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          SpecMatch: PDF Comparison Tool
        </h1>
        <PDFComparisonTool isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}

export default App;