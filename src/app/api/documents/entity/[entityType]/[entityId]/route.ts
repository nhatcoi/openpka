import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/documents/entity/[entityType]/[entityId] - Lấy documents theo entity
export async function GET(
  request: NextRequest,
  { params }: { params: { entityType: string; entityId: string } }
) {
  try {
    const { entityType, entityId } = params;
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const documentType = searchParams.get('document_type');
    const isActive = searchParams.get('is_active');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {
      entity_type: entityType,
      entity_id: BigInt(entityId)
    };
    
    if (documentType) {
      where.document_type = documentType;
    }
    
    if (isActive !== null) {
      where.is_active = isActive === 'true';
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
    
    // Group documents by type for easier frontend handling
    const documentsByType = documents.reduce((acc, doc) => {
      if (!acc[doc.document_type]) {
        acc[doc.document_type] = [];
      }
      acc[doc.document_type].push({
        ...doc,
        id: doc.id.toString(),
        entity_id: doc.entity_id.toString(),
        uploaded_by: doc.uploaded_by?.toString() || null,
        file_size: doc.file_size?.toString() || null
      });
      return acc;
    }, {} as Record<string, any[]>);
    
    return NextResponse.json({
      success: true,
      data: {
        documents: documents.map(doc => ({
          ...doc,
          id: doc.id.toString(),
          entity_id: doc.entity_id.toString(),
          uploaded_by: doc.uploaded_by?.toString() || null,
          file_size: doc.file_size?.toString() || null
        })),
        documentsByType,
        entity: {
          type: entityType,
          id: entityId
        }
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching entity documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch entity documents' },
      { status: 500 }
    );
  }
}
