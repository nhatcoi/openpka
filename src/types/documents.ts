// Types cho Document system
export interface Document {
  id: bigint;
  entity_type: string;
  entity_id: bigint;
  document_type: string;
  file_name: string;
  original_name?: string;
  file_url: string;
  file_path?: string;
  file_size?: bigint;
  mime_type?: string;
  description?: string;
  uploaded_by?: bigint;
  uploaded_at?: Date;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateDocumentInput {
  entity_type: string;
  entity_id: bigint;
  document_type: string;
  file_name: string;
  original_name?: string;
  file_url: string;
  file_path?: string;
  file_size?: bigint;
  mime_type?: string;
  description?: string;
  uploaded_by?: bigint;
}

export interface UpdateDocumentInput {
  document_type?: string;
  file_name?: string;
  description?: string;
  is_active?: boolean;
}

export interface DocumentFilters {
  entity_type?: string;
  entity_id?: bigint;
  document_type?: string;
  uploaded_by?: bigint;
  is_active?: boolean;
  mime_type?: string;
  date_from?: Date;
  date_to?: Date;
}

// Constants cho document types
export const DOCUMENT_TYPES = {
  CERTIFICATE: 'certificate',
  SYLLABUS: 'syllabus',
  CONTRACT: 'contract',
  IMAGE: 'image',
  PDF: 'pdf',
  WORD: 'word',
  EXCEL: 'excel',
  PRESENTATION: 'presentation',
  AUDIO: 'audio',
  VIDEO: 'video',
  ARCHIVE: 'archive',
  OTHER: 'other'
} as const;

// Constants cho entity types
export const ENTITY_TYPES = {
  ORG_UNIT: 'org_unit',
  COURSE: 'course',
  MAJOR: 'major',
  PROGRAM: 'program',
  EMPLOYEE: 'employee',
  STUDENT: 'student',
  TRAINING: 'training',
  WORKFLOW: 'workflow',
  OTHER: 'other'
} as const;

// MIME types mapping
export const MIME_TYPES = {
  PDF: 'application/pdf',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLS: 'application/vnd.ms-excel',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  PPT: 'application/vnd.ms-powerpoint',
  PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  JPEG: 'image/jpeg',
  JPG: 'image/jpeg',
  PNG: 'image/png',
  GIF: 'image/gif',
  MP4: 'video/mp4',
  MP3: 'audio/mpeg',
  ZIP: 'application/zip',
  RAR: 'application/x-rar-compressed'
} as const;

// Utility functions - moved to cloudinary-client.ts for better separation
