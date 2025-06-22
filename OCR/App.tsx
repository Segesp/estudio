
import React, { useState, useCallback, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import LoadingIndicator from './components/LoadingIndicator';
import TextDisplay from './components/TextDisplay';
import { extractTextFromImage } from './services/geminiService';
import { convertPdfToImages, PdfPageImage } from './utils/pdfUtils';
import { PageText } from './types';

// Safely check for API Key availability
const API_KEY_AVAILABLE = !!(typeof process !== 'undefined' && process.env && process.env.API_KEY);

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [pagesText, setPagesText] = useState<PageText[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Initialize dark mode based on system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Listen for changes in system preference
    const mediaQueryListener = (event: MediaQueryListEvent) => {
      const newDarkMode = event.matches;
      setDarkMode(newDarkMode);
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', mediaQueryListener);
    
    return () => {
        window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', mediaQueryListener);
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prevMode => {
      const newMode = !prevMode;
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newMode;
    });
  };

  const handleFileSelect = useCallback(async (file: File) => { // Made async to match processPdf potentially
    if (!API_KEY_AVAILABLE) {
      setError("Gemini API Key is not configured. Please set the API_KEY environment variable in your deployment.");
      return;
    }
    setSelectedFile(file);
    setPagesText([]); // Clear previous results
    setError(null); // Clear previous errors
    await processPdf(file); // Call processPdf directly
  }, []); // Removed processPdf from dependencies as it's defined in the same scope and recreated

  const processPdf = async (file: File) => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setPagesText([]);

    try {
      setProcessingMessage('Converting PDF to images...');
      const images: PdfPageImage[] = await convertPdfToImages(file, (progress) => {
        setProcessingMessage(`Converting PDF to images... Page ${progress.processedPages}/${progress.totalPages}`);
      });

      const extractedTexts: PageText[] = [];
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        setProcessingMessage(`Extracting text from page ${image.pageNumber}/${images.length}...`);
        // Ensure extractTextFromImage properly throws errors that can be caught here
        const text = await extractTextFromImage(image.base64Data, image.mimeType);
        if (text.startsWith("Error extracting text:")) { // Check if geminiService returned an error string
            throw new Error(text);
        }
        extractedTexts.push({ pageNumber: image.pageNumber, text });
      }
      setPagesText(extractedTexts);
    } catch (err) {
      console.error("Error processing PDF:", err);
      // Ensure error message is user-friendly
      let errorMessage = "An unexpected error occurred during PDF processing.";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      // Customize specific error messages if needed
      if (errorMessage.includes("API Key invalid or missing permissions")) {
        errorMessage = "Failed to extract text due to an API Key issue. Please check the key and its permissions.";
      } else if (errorMessage.includes("Gemini API Key is not configured")) {
         errorMessage = "Gemini API Key is not configured. Please set the API_KEY environment variable in your deployment.";
      }
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };
  
  const resetState = () => {
    setSelectedFile(null);
    setPagesText([]);
    setError(null);
    setIsProcessing(false);
    setProcessingMessage('');
    // If using an input type="file", clear its value to allow re-selection of the same file
    const fileInput = document.getElementById('pdf-upload-input') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
  };

  return (
    <div className="min-h-screen container mx-auto p-4 sm:p-8 flex flex-col">
      <header className="mb-8 text-center relative">
        <h1 className="text-4xl sm:text-5xl font-bold text-sky-600 dark:text-sky-400">PDF Text Extractor</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Upload a scanned PDF to extract its text content using AI-powered OCR.
        </p>
        <button
          onClick={toggleDarkMode}
          className="absolute top-0 right-0 p-2 text-xl text-slate-500 hover:text-sky-500 dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
          aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>
      </header>

      <main className="flex-grow">
        {!API_KEY_AVAILABLE && !error && ( // Show this only if API key is not available and no other error has been set yet
           <div role="alert" className="my-4 p-4 bg-yellow-100 dark:bg-yellow-700 border border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-200 rounded-lg">
             <p className="font-semibold">API Key Configuration Required</p>
             <p>The Gemini API Key is not configured or accessible. This application requires a valid API key to function. Please ensure the <code>API_KEY</code> environment variable is correctly set in your deployment environment.</p>
           </div>
        )}

        {error && (
          <div role="alert" className="my-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg">
            <div className="flex justify-between items-center">
                <p><span className="font-semibold">Error:</span> {error}</p>
                <button onClick={() => setError(null)} className="ml-2 text-red-500 dark:text-red-300 hover:text-red-700 dark:hover:text-red-500" aria-label="Dismiss error">
                    <i className="fas fa-times"></i>
                </button>
            </div>
          </div>
        )}

        <div className="mb-6 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <FileUploader onFileSelect={handleFileSelect} disabled={isProcessing || !API_KEY_AVAILABLE} />
        </div>
        
        {isProcessing && <LoadingIndicator message={processingMessage} />}

        {!isProcessing && pagesText.length > 0 && selectedFile && (
          <>
            <button 
              onClick={resetState}
              className="mb-4 px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-md transition-colors flex items-center gap-2"
            >
              <i className="fas fa-file-arrow-up"></i> Process Another PDF
            </button>
            <TextDisplay pagesText={pagesText} fileName={selectedFile.name} />
          </>
        )}
      </main>

      <footer className="text-center mt-12 py-4 border-t border-slate-300 dark:border-slate-700">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          PDF Text Extractor &copy; {new Date().getFullYear()}. Powered by Gemini API and React.
        </p>
      </footer>
    </div>
  );
};

export default App;
