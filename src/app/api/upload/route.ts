import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entity_type') as string;
    const entityId = formData.get('entity_id') as string;
    const documentType = formData.get('document_type') as string;
    const description = formData.get('description') as string;
    const folder = (formData.get('folder') as string) || `documents/${entityType}`;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!entityType || !entityId || !documentType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: entity_type, entity_id, document_type' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Upload to local storage (temporary solution)
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const uploadPath = `/uploads/${folder}/${fileName}`;
    const fullPath = `public${uploadPath}`;
    
    // Create directory if not exists
    const fs = require('fs');
    const path = require('path');
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Save file locally
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(fullPath, buffer);
    
    const uploadResult = {
      publicUrl: uploadPath,
      path: uploadPath,
      size: file.size,
      contentType: file.type
    };

    // Save to database
    const document = await db.document.create({
      data: {
        entity_type: entityType,
        entity_id: BigInt(entityId),
        document_type: documentType,
        file_name: file.name,
        original_name: file.name,
        file_url: uploadResult.publicUrl,
        file_path: uploadResult.path, // bucket/path
        file_size: BigInt(uploadResult.size),
        mime_type: uploadResult.contentType || file.type,
        description: description || null,
        uploaded_by: BigInt(session.user.id)
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        document: {
          ...document,
          id: document.id?.toString?.() ?? String(document.id),
          entity_id: document.entity_id?.toString?.() ?? String(document.entity_id),
          uploaded_by: document.uploaded_by ? document.uploaded_by.toString() : null,
          file_size: document.file_size ? document.file_size.toString() : null
        },
        storage: {
          provider: 'local',
          publicUrl: uploadResult.publicUrl,
          path: uploadResult.path
        }
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to get upload configuration
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: [
          'image/jpeg',
          'image/png', 
          'image/gif',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'text/csv',
          'application/zip',
          'application/x-rar-compressed'
        ],
        entityTypes: [
          'org_unit',
          'course', 
          'major',
          'program',
          'employee',
          'student',
          'training',
          'workflow'
        ],
        documentTypes: [
          'certificate',
          'syllabus',
          'contract',
          'image',
          'pdf',
          'word',
          'excel',
          'presentation',
          'audio',
          'video',
          'archive',
          'other'
        ]
      }
    });
  } catch (error) {
    console.error('Get upload config error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get upload configuration' },
      { status: 500 }
    );
  }
}
