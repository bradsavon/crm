'use client';

import { useState, useEffect } from 'react';
import DocumentPreview from './DocumentPreview';

interface Document {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  description?: string;
  category?: string;
  uploadedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface DocumentListProps {
  relatedEntityType: 'contact' | 'company' | 'deal';
  relatedEntityId: string;
  onDelete?: () => void;
  refreshTrigger?: number;
}

export default function DocumentList({ relatedEntityType, relatedEntityId, onDelete, refreshTrigger }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [relatedEntityType, relatedEntityId, refreshTrigger]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(
        `/api/documents?relatedEntityType=${relatedEntityType}&relatedEntityId=${relatedEntityId}`
      );
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchDocuments();
        if (onDelete) onDelete();
      } else {
        alert(data.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('image')) return '🖼️';
    return '📎';
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading documents...</div>;
  }

  if (documents.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-4">No documents attached</div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc._id}
          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <span className="text-2xl">{getFileIcon(doc.mimeType)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <DocumentPreview document={doc}>
                  <a
                    href={doc.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 truncate"
                  >
                    {doc.originalName}
                  </a>
                </DocumentPreview>
                {doc.category && (
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                    {doc.category}
                  </span>
                )}
              </div>
              {doc.description && (
                <p className="text-xs text-gray-500 mt-1">{doc.description}</p>
              )}
              <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                <span>{formatFileSize(doc.size)}</span>
                <span>•</span>
                <span>Uploaded {new Date(doc.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <span>by {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <a
              href={doc.path}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 text-sm"
              title="Download"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
            <button
              onClick={() => handleDelete(doc._id)}
              className="text-red-600 hover:text-red-700 text-sm"
              title="Delete"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

