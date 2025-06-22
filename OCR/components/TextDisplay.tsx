
import React, { useState, useMemo } from 'react';
import { PageText } from '../types';

interface TextDisplayProps {
  pagesText: PageText[];
  fileName: string;
}

const TextDisplay: React.FC<TextDisplayProps> = ({ pagesText, fileName }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const combinedText = useMemo(() => {
    return pagesText.map(pt => `Page ${pt.pageNumber}:\n${pt.text}`).join('\n\n---\n\n');
  }, [pagesText]);

  const highlightedText = useMemo(() => {
    if (!searchTerm.trim()) {
      return combinedText;
    }
    // Escape regex special characters in search term
    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
    return combinedText.replace(regex, '<mark class="bg-yellow-300 dark:bg-yellow-500 rounded px-0.5">$1</mark>');
  }, [combinedText, searchTerm]);

  const handleDownloadText = () => {
    const blob = new Blob([combinedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeFileName = fileName.replace(/\.[^/.]+$/, "") + "_extracted_text.txt"; // remove .pdf and add _extracted_text.txt
    link.download = safeFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!pagesText.length) {
    return null; // Or some placeholder if needed
  }

  return (
    <div className="mt-6 p-6 bg-white dark:bg-slate-800 shadow-lg rounded-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300">Extracted Text</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="search"
            placeholder="Search in text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-slate-200 w-full sm:w-64"
          />
          <button
            onClick={handleDownloadText}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-md transition-colors flex items-center gap-2 whitespace-nowrap"
            title="Download extracted text as .txt file"
          >
            <i className="fas fa-download"></i>
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>
      <div
        className="prose prose-slate dark:prose-invert max-w-none p-4 h-96 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800/50"
        dangerouslySetInnerHTML={{ __html: highlightedText.replace(/\n/g, '<br />') }}
      />
       {searchTerm && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Found { (highlightedText.match(/<mark/g) || []).length } matches.</p>}
    </div>
  );
};

export default TextDisplay;
