'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Document {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  description?: string;
  category?: string;
  uploadedBy: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  path: string;
}

interface DocumentPreviewProps {
  document: Document;
  children: React.ReactNode;
}

export default function DocumentPreview({ document, children }: DocumentPreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewStyle, setPreviewStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileType = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'PDF Document';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'Word Document';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel Spreadsheet';
    if (mimeType.includes('image')) {
      if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'JPEG Image';
      if (mimeType.includes('png')) return 'PNG Image';
      if (mimeType.includes('gif')) return 'GIF Image';
      return 'Image';
    }
    if (mimeType.includes('text')) return 'Text File';
    return 'Document';
  };

  const isImage = document.mimeType.includes('image');
  const isPDF = document.mimeType.includes('pdf') || document.originalName.toLowerCase().endsWith('.pdf');

  const calculatePosition = useCallback(() => {
    if (!containerRef.current || !previewRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const previewRect = previewRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 12;
    const gap = 8;

    const previewWidth = previewRect.width || 500;
    const previewHeight = previewRect.height || (isImage ? 400 : isPDF ? 500 : 250);

    // Start with preferred: below, centered
    let top = containerRect.bottom + gap;
    let left = containerRect.left + containerRect.width / 2;
    let transformX = '-50%';

    // Check vertical
    const spaceBelow = viewportHeight - containerRect.bottom;
    const spaceAbove = containerRect.top;

    if (spaceBelow < previewHeight + padding) {
      // Not enough space below
      if (spaceAbove >= previewHeight + padding) {
        // Position above
        top = containerRect.top - previewHeight - gap;
      } else {
        // Constrain to viewport
        top = Math.max(padding, viewportHeight - previewHeight - padding);
      }
    } else {
      // Check if it would go off bottom
      if (top + previewHeight > viewportHeight - padding) {
        top = viewportHeight - previewHeight - padding;
      }
    }

    // Check if goes off top
    if (top < padding) {
      top = padding;
    }

    // Horizontal positioning
    const halfWidth = previewWidth / 2;
    let actualLeft = left - (transformX === '-50%' ? halfWidth : transformX === '-100%' ? previewWidth : 0);
    let actualRight = actualLeft + previewWidth;

    // Adjust right edge
    if (actualRight > viewportWidth - padding) {
      const overflow = actualRight - (viewportWidth - padding);
      left = left - overflow;
      actualLeft = left - halfWidth;
      
      if (actualLeft < padding) {
        left = viewportWidth - padding;
        transformX = '-100%';
      }
    }
    // Adjust left edge
    else if (actualLeft < padding) {
      const overflow = padding - actualLeft;
      left = left + overflow;
      actualLeft = left - halfWidth;
      
      if (actualLeft < padding) {
        left = padding;
        transformX = '0%';
      }
    }

    setPreviewStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      transform: `translateX(${transformX})`,
      zIndex: 50,
    });
  }, [isImage]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (containerRef.current) {
        setShowPreview(true);
      }
    }, 300);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowPreview(false);
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Calculate position when preview is shown and on changes
  useEffect(() => {
    if (!showPreview) return;

    // Initial calculation
    const calculate = () => {
      requestAnimationFrame(() => {
        calculatePosition();
      });
    };

    // Run multiple times to catch different render states
    calculate();
    const t1 = setTimeout(calculate, 10);
    const t2 = setTimeout(calculate, 50);
    const t3 = setTimeout(calculate, 100);
    const t4 = setTimeout(calculate, 200);

    // Watch for resize
    if (previewRef.current) {
      observerRef.current = new ResizeObserver(() => {
        calculate();
      });
      observerRef.current.observe(previewRef.current);
    }

    window.addEventListener('scroll', calculate, { passive: true });
    window.addEventListener('resize', calculate, { passive: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      window.removeEventListener('scroll', calculate);
      window.removeEventListener('resize', calculate);
    };
  }, [showPreview, calculatePosition]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative inline-block"
    >
      {children}
      {showPreview && (
        <div
          ref={previewRef}
          className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[400px] max-w-[600px]"
          style={previewStyle}
          onMouseEnter={() => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
          }}
          onMouseLeave={handleMouseLeave}
        >
          {/* Image Preview */}
          {isImage && (
            <div className="mb-3 rounded overflow-hidden border border-gray-200">
              <img
                src={document.path}
                alt={document.originalName}
                className="w-full h-auto max-h-64 object-contain bg-gray-50"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={calculatePosition}
              />
            </div>
          )}

          {/* PDF Preview */}
          {isPDF && (
            <div className="mb-3 rounded overflow-hidden border border-gray-200 bg-gray-50">
              <iframe
                src={document.path}
                className="w-full h-96 border-0"
                title={document.originalName}
                onLoad={calculatePosition}
              />
              <div className="p-2 bg-gray-100 text-xs text-gray-600 text-center">
                <a
                  href={document.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open PDF in new tab
                </a>
              </div>
            </div>
          )}

          {/* Document Info */}
          <div className="space-y-2">
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1 break-words">
                {document.originalName}
              </h4>
              <p className="text-xs text-gray-500">{getFileType(document.mimeType)}</p>
            </div>

            {document.description && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-600">{document.description}</p>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Size:</span>
                <span className="text-gray-900 font-medium">{formatFileSize(document.size)}</span>
              </div>
              {document.category && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Category:</span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    {document.category}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Uploaded:</span>
                <span className="text-gray-900">
                  {new Date(document.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">By:</span>
                <span className="text-gray-900">
                  {document.uploadedBy.firstName} {document.uploadedBy.lastName}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
