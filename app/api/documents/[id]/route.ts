import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join } from 'path';
import connectDB from '@/lib/mongodb';
import Document from '@/models/Document';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { createActivity } from '@/lib/activity';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();
    const document = await Document.findById(params.id)
      .populate('uploadedBy', 'firstName lastName email');

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: document });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();
    const document = await Document.findById(params.id);

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Only creator or admin/manager can delete
    const docObj = document.toObject();
    if (!hasPermission(currentUser, 'manager')) {
      if (docObj.uploadedBy.toString() !== currentUser.id) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Delete file from filesystem
    try {
      const filepath = join(process.cwd(), 'public', document.path);
      await unlink(filepath);
    } catch (fileError) {
      // File might not exist, continue with database deletion
      console.error('Error deleting file:', fileError);
    }

    // Delete from database
    await Document.findByIdAndDelete(params.id);

    // Log activity
    await createActivity({
      type: 'deleted',
      entityType: document.relatedEntityType,
      entityId: document.relatedEntityId,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      description: `Deleted document: ${document.originalName}`,
    });

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

