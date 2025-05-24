import { Suspense, lazy } from 'react';
import AppHeader from './components/AppHeader';
import AppFooter from './components/AppFooter';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Lazy load the PDFComparisonTool to improve initial load performance
const PDFComparisonTool = lazy(() => import('./components/PDFComparisonTool'));

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AppHeader />
      
      <main className="flex-grow p-4 md:p-6">
        <Suspense fallback={<div className="flex justify-center items-center h-[80vh]"><LoadingSpinner size="large" /></div>}>
          <PDFComparisonTool />
        </Suspense>
      </main>
      
      <AppFooter />
    </div>
  );
}

export default App;