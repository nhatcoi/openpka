import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CreateDocumentInput, DocumentFilters } from '@/types/documents';

// GET /api/documents - Lấy danh sách documents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters từ query parameters
    const filters: DocumentFilters = {};
    
    if (searchParams.get('entity_type')) {
      filters.entity_type = searchParams.get('entity_type')!;
    }
    
    if (searchParams.get('entity_id')) {
      filters.entity_id = BigInt(searchParams.get('entity_id')!);
    }
    
    if (searchParams.get('document_type')) {
      filters.document_type = searchParams.get('document_type')!;
    }
    
    if (searchParams.get('uploaded_by')) {
      filters.uploaded_by = BigInt(searchParams.get('uploaded_by')!);
    }
    
    if (searchParams.get('is_active') !== null) {
      filters.is_active = searchParams.get('is_active') === 'true';
    }
    
    if (searchParams.get('mime_type')) {
      filters.mime_type = searchParams.get('mime_type')!;
    }
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    
    if (filters.entity_type) where.entity_type = filters.entity_type;
    if (filters.entity_id) where.entity_id = filters.entity_id;
    if (filters.document_type) where.document_type = filters.document_type;
    if (filters.uploaded_by) where.uploaded_by = filters.uploaded_by;
    if (filters.is_active !== undefined) where.is_active = filters.is_active;
    if (filters.mime_type) where.mime_type = filters.mime_type;
    
    // Date filters
    if (filters.date_from || filters.date_to) {
      where.uploaded_at = {};
      if (filters.date_from) where.uploaded_at.gte = filters.date_from;
      if (filters.date_to) where.uploaded_at.lte = filters.date_to;
    }
    
    // Query documents
    const [documents, total] = await Promise.all([
      db.document.findMany({
        where,
        orderBy: {
          uploaded_at: 'desc'
        },
        skip,
        take: limit
      }),
      db.document.count({ where })
    ]);

    // Serialize BigInt fields safely
    const serialized = documents.map((doc) => ({
      ...doc,
      id: doc.id?.toString(),
      entity_id: doc.entity_id?.toString(),
      uploaded_by: doc.uploaded_by !== null && doc.uploaded_by !== undefined ? doc.uploaded_by.toString() : null,
      file_size: doc.file_size !== null && doc.file_size !== undefined ? doc.file_size.toString() : null,
    }));
    
    return NextResponse.json({
      success: true,
      data: serialized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST /api/documents - Tạo document mới
export async function POST(request: NextRequest) {
  try {
    const body: CreateDocumentInput = await request.json();
    
    // Validate required fields
    if (!body.entity_type || !body.entity_id || !body.document_type || !body.file_name || !body.file_url) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create document
    const document = await db.document.create({
      data: {
        entity_type: body.entity_type,
        entity_id: body.entity_id,
        document_type: body.document_type,
        file_name: body.file_name,
        original_name: body.original_name,
        file_url: body.file_url,
        file_path: body.file_path,
        file_size: body.file_size,
        mime_type: body.mime_type,
        description: body.description,
        uploaded_by: body.uploaded_by
      }
    });
    
    // Serialize response
    const serialized = {
      ...document,
      id: document.id?.toString(),
      entity_id: document.entity_id?.toString(),
      uploaded_by: document.uploaded_by !== null && document.uploaded_by !== undefined ? document.uploaded_by.toString() : null,
      file_size: document.file_size !== null && document.file_size !== undefined ? document.file_size.toString() : null,
    };

    return NextResponse.json({
      success: true,
      data: serialized
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create document' },
      { status: 500 }
    );
  }
}
