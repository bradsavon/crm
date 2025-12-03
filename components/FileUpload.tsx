'use client';

import { useState, useRef } from 'react';

interface FileUploadProps {
  relatedEntityType: 'contact' | 'company' | 'deal';
  relatedEntityId: string;
  onUploadSuccess?: () => void;
  category?: string;
  onUpload?: () => void;
}

export default function FileUpload({ relatedEntityType, relatedEntityId, onUploadSuccess, category, onUpload }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [fileCategory, setFileCategory] = useState(category || '');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size exceeds 10MB limit');
      return false;
    }

    setError('');
    setSelectedFile(file);
    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    validateAndSetFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    validateAndSetFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('relatedEntityType', relatedEntityType);
      formData.append('relatedEntityId', relatedEntityId);
      if (description) formData.append('description', description);
      if (fileCategory) formData.append('category', fileCategory);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        // Reset form
        setSelectedFile(null);
        setDescription('');
        setFileCategory(category || '');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        if (onUpload) {
          onUpload();
        }
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        setError(data.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setDescription('');
    setFileCategory(category || '');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Upload Document</h3>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-sm">
          {error}
        </div>
      )}
      <div className="space-y-3">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : selectedFile
              ? 'border-gray-300 bg-white'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />
          <p className="mt-2 text-xs text-gray-500 text-center">or drag and drop a file here</p>
          <p className="mt-1 text-xs text-gray-500 text-center">Maximum file size: 10MB</p>
          {selectedFile && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">{selectedFile.name}</span>
                  <span className="text-gray-500 ml-2">({formatFileSize(selectedFile.size)})</span>
                </div>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-red-600 hover:text-red-700 text-xs"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Description (optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the document"
            disabled={!selectedFile || uploading}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Category (optional)</label>
          <select
            value={fileCategory}
            onChange={(e) => setFileCategory(e.target.value)}
            disabled={!selectedFile || uploading}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select category</option>
            <option value="contract">Contract</option>
            <option value="proposal">Proposal</option>
            <option value="invoice">Invoice</option>
            <option value="report">Report</option>
            <option value="other">Other</option>
          </select>
        </div>
        {selectedFile && (
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={uploading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

