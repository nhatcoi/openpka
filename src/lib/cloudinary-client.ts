// Client-side utilities for Cloudinary (no server-side imports)

/**
 * Get file type from MIME type (Client-side safe)
 */
export function getFileTypeFromMime(mimeType: string): string {
  const mimeToType: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/msword': 'word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'word',
    'application/vnd.ms-excel': 'excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
    'application/vnd.ms-powerpoint': 'presentation',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'presentation',
    'image/jpeg': 'image',
    'image/png': 'image',
    'image/gif': 'image',
    'image/webp': 'image',
    'video/mp4': 'video',
    'video/avi': 'video',
    'video/mov': 'video',
    'audio/mpeg': 'audio',
    'audio/wav': 'audio',
    'application/zip': 'archive',
    'application/x-rar-compressed': 'archive',
    'text/plain': 'text',
    'text/csv': 'text'
  };
  
  return mimeToType[mimeType] || 'other';
}

/**
 * Get file size in human readable format (Client-side safe)
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate Cloudinary URL manually (Client-side safe)
 */
export function generateCloudinaryUrl(
  publicId: string,
  transformations: Record<string, any> = {},
  resourceType: string = 'auto',
  cloudName?: string
): string {
  const baseUrl = 'https://res.cloudinary.com';
  const finalCloudName = cloudName || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dummy';
  
  // Build transformation string
  const transformParts: string[] = [];
  
  Object.entries(transformations).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      transformParts.push(`${key}_${value}`);
    }
  });
  
  const transformString = transformParts.length > 0 ? transformParts.join(',') + '/' : '';
  
  return `${baseUrl}/${finalCloudName}/${resourceType}/upload/${transformString}${publicId}`;
}

/**
 * Generate thumbnail URL (Client-side safe)
 */
export function getThumbnailUrl(
  publicId: string, 
  width: number = 150, 
  height: number = 150,
  cloudName?: string
): string {
  return generateCloudinaryUrl(publicId, {
    width,
    height,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto'
  }, 'image', cloudName);
}

/**
 * Get document icon based on file type
 */
export function getDocumentIcon(documentType: string, mimeType?: string) {
  if (mimeType?.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType?.startsWith('video/')) return 'video';
  if (mimeType?.startsWith('audio/')) return 'audio';
  if (mimeType?.includes('zip') || mimeType?.includes('rar')) return 'archive';
  return 'document';
}

/**
 * Get document color based on file type
 */
export function getDocumentColor(documentType: string): string {
  const colors: Record<string, string> = {
    image: '#4caf50',
    pdf: '#f44336',
    video: '#ff9800',
    audio: '#9c27b0',
    archive: '#795548',
    word: '#2196f3',
    excel: '#4caf50',
    presentation: '#ff5722',
    other: '#607d8b'
  };
  return colors[documentType] || colors.other;
}
