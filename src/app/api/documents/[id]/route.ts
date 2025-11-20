import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UpdateDocumentInput } from '@/types/documents';

// GET /api/documents/[id] - Lấy document theo ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = BigInt(params.id);
    
    const document = await db.document.findUnique({
      where: { id: documentId }
    });
    
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...document,
        id: document.id.toString(),
        entity_id: document.entity_id.toString(),
        uploaded_by: document.uploaded_by?.toString() || null,
        file_size: document.file_size?.toString() || null
      }
    });
    
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// PUT /api/documents/[id] - Cập nhật document
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = BigInt(params.id);
    const body: UpdateDocumentInput = await request.json();
    
    // Check if document exists
    const existingDocument = await db.document.findUnique({
      where: { id: documentId }
    });
    
    if (!existingDocument) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Update document
    const updatedDocument = await db.document.update({
      where: { id: documentId },
      data: {
        document_type: body.document_type,
        file_name: body.file_name,
        description: body.description,
        is_active: body.is_active,
        updated_at: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        ...updatedDocument,
        id: updatedDocument.id.toString(),
        entity_id: updatedDocument.entity_id.toString(),
        uploaded_by: updatedDocument.uploaded_by?.toString() || null,
        file_size: updatedDocument.file_size?.toString() || null
      }
    });
    
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - Xóa document (soft delete + delete from local storage)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = BigInt(params.id);
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';
    
    // Check if document exists
    const existingDocument = await db.document.findUnique({
      where: { id: documentId }
    });
    
    if (!existingDocument) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }
    
    let deletedDocument;
    
    if (hardDelete) {
      // Hard delete - remove from database and local file
      try {
        // Delete local file if exists
        const fs = require('fs');
        const path = require('path');
        const fullPath = path.join(process.cwd(), 'public', existingDocument.file_url);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log('Deleted local file:', fullPath);
        }
      } catch (storageError) {
        console.warn('Failed to delete local file:', storageError);
        // Continue with database deletion even if file deletion fails
      }
      
      // Delete from database
      deletedDocument = await db.document.delete({
        where: { id: documentId }
      });
    } else {
      // Soft delete - set is_active to false
      deletedDocument = await db.document.update({
        where: { id: documentId },
        data: {
          is_active: false,
          updated_at: new Date()
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: hardDelete ? 'Document permanently deleted' : 'Document deleted successfully',
      data: {
        ...deletedDocument,
        id: deletedDocument.id.toString(),
        entity_id: deletedDocument.entity_id.toString(),
        uploaded_by: deletedDocument.uploaded_by?.toString() || null,
        file_size: deletedDocument.file_size?.toString() || null
      }
    });
    
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
