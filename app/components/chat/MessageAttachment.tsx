'use client';

import { useState } from 'react';

interface Attachment {
  id?: string;
  file_url: string;
  file_type?: string;
  mime_type?: string;
  original_name?: string;
  thumbnail_url?: string;
  size_bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
}

interface MessageAttachmentProps {
  attachment: Attachment;
  compact?: boolean;
}

export default function MessageAttachment({ attachment, compact = false }: MessageAttachmentProps) {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const fileType = attachment.file_type || 'file';
  const fileName = attachment.original_name || 'File';
  const fileSize = attachment.size_bytes ? formatFileSize(attachment.size_bytes) : '';

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function formatDuration(seconds?: number): string {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Image attachment
  if (fileType === 'image' && !imageError) {
    return (
      <div className={compact ? 'max-w-xs' : 'max-w-sm'}>
        <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
          <img
            src={attachment.file_url}
            alt={fileName}
            className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity max-w-full h-auto"
            style={{ maxHeight: compact ? '150px' : '300px' }}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        </a>
        {!compact && fileName && (
          <div className="text-xs text-gray-500 mt-1 truncate">{fileName}</div>
        )}
      </div>
    );
  }

  // Video attachment
  if (fileType === 'video' && !videoError) {
    return (
      <div className={compact ? 'max-w-xs' : 'max-w-sm'}>
        <video
          controls
          className="rounded-lg max-w-full h-auto"
          style={{ maxHeight: compact ? '150px' : '300px' }}
          onError={() => setVideoError(true)}
          poster={attachment.thumbnail_url}
        >
          <source src={attachment.file_url} type={attachment.mime_type || 'video/mp4'} />
          Your browser does not support the video tag.
        </video>
        {!compact && (
          <div className="text-xs text-gray-500 mt-1 flex justify-between">
            <span className="truncate flex-1">{fileName}</span>
            {attachment.duration && (
              <span className="ml-2">{formatDuration(attachment.duration)}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Audio attachment
  if (fileType === 'audio') {
    return (
      <div className={compact ? 'w-64' : 'w-80'}>
        <div className="bg-gray-100 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{fileName}</div>
              {fileSize && (
                <div className="text-xs text-gray-500">
                  {fileSize}
                  {attachment.duration && ` • ${formatDuration(attachment.duration)}`}
                </div>
              )}
            </div>
          </div>
          <audio controls className="w-full" style={{ height: '40px' }}>
            <source src={attachment.file_url} type={attachment.mime_type || 'audio/mpeg'} />
            Your browser does not support the audio tag.
          </audio>
        </div>
      </div>
    );
  }

  // Document/File attachment
  return (
    <a
      href={attachment.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block bg-gray-100 hover:bg-gray-200 rounded-lg p-3 transition-colors ${
        compact ? 'max-w-xs' : 'max-w-sm'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">{fileName}</div>
          {fileSize && <div className="text-xs text-gray-500">{fileSize}</div>}
        </div>
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
        </div>
      </div>
    </a>
  );
}

