import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import connectDB from '@/lib/mongodb';
import Document from '@/models/Document';
import { getCurrentUser } from '@/lib/auth';
import { createActivity } from '@/lib/activity';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const relatedEntityType = formData.get('relatedEntityType') as string;
    const relatedEntityId = formData.get('relatedEntityId') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!relatedEntityType || !relatedEntityId) {
      return NextResponse.json(
        { success: false, error: 'Related entity type and ID are required' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    await connectDB();

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const filename = `${timestamp}-${randomString}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Save document metadata to database
    const document = await Document.create({
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      path: `/uploads/${filename}`,
      uploadedBy: currentUser.id,
      relatedEntityType,
      relatedEntityId,
      description: description || undefined,
      category: category || undefined,
    });

    // Log activity
    await createActivity({
      type: 'created',
      entityType: relatedEntityType as 'contact' | 'company' | 'case',
      entityId: relatedEntityId,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      description: `Uploaded document: ${file.name}`,
      metadata: { documentId: document._id.toString() },
    });

    const populatedDoc = await Document.findById(document._id)
      .populate('uploadedBy', 'firstName lastName email');

    return NextResponse.json({ success: true, data: populatedDoc }, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

