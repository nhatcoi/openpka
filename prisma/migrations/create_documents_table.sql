-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id BIGSERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id BIGINT NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  file_url VARCHAR NOT NULL,
  file_path VARCHAR(500),
  file_size BIGINT,
  mime_type VARCHAR(100),
  description TEXT,
  uploaded_by BIGINT,
  uploaded_at TIMESTAMPTZ(6) DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_entity ON public.documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_active ON public.documents(is_active);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON public.documents(uploaded_at);

-- Add comments
COMMENT ON TABLE public.documents IS 'Stores system-wide documents associated with entities';
COMMENT ON COLUMN public.documents.entity_type IS 'Type of entity (e.g., org_unit, course, major, program, employee)';
COMMENT ON COLUMN public.documents.entity_id IS 'ID of the associated entity';
COMMENT ON COLUMN public.documents.document_type IS 'Type of document (e.g., certificate, contract, syllabus, report)';
COMMENT ON COLUMN public.documents.file_url IS 'URL or path to the document file';
COMMENT ON COLUMN public.documents.file_path IS 'Physical file path on server';
COMMENT ON COLUMN public.documents.is_active IS 'Whether the document is currently active';

