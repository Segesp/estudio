
import React, { useCallback, useState } from 'react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, disabled }) => {
  const [dragging, setDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === "application/pdf") {
        onFileSelect(file);
      } else {
        alert("Please select a PDF file.");
      }
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    if (disabled) return;

    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        onFileSelect(file);
      } else {
        alert("Please select a PDF file.");
      }
    }
  }, [onFileSelect, disabled]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) setDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
  }, []);

  return (
    <div
      className={`p-8 border-2 border-dashed rounded-lg text-center transition-colors
                  ${dragging ? 'border-sky-500 bg-sky-50 dark:bg-sky-900' : 'border-slate-300 dark:border-slate-600 hover:border-sky-400 dark:hover:border-sky-500'}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && document.getElementById('pdf-upload-input')?.click()}
    >
      <input
        type="file"
        id="pdf-upload-input"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <div className="flex flex-col items-center justify-center space-y-2">
        <i className={`fas fa-file-pdf text-4xl ${dragging ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`}></i>
        <p className="text-slate-600 dark:text-slate-400">
          {dragging ? "Drop PDF here" : "Drag & drop a PDF file here, or click to select"}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-500">Maximum file size: 50MB (Recommended)</p>
      </div>
    </div>
  );
};

export default FileUploader;
