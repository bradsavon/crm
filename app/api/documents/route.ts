import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Document from '@/models/Document';
import Contact from '@/models/Contact';
import Company from '@/models/Company';
import Case from '@/models/Case';
import { getCurrentUser, hasPermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const relatedEntityType = searchParams.get('relatedEntityType');
    const relatedEntityId = searchParams.get('relatedEntityId');
    const category = searchParams.get('category');

    // Build query
    let query: any = {};

    if (relatedEntityType && relatedEntityId) {
      query.relatedEntityType = relatedEntityType;
      query.relatedEntityId = relatedEntityId;
    }

    if (category) {
      query.category = category;
    }

    // Users can only see documents for entities they have access to
    // For simplicity, we'll show all documents but filter by entity access in the UI
    // In production, you'd want more sophisticated permission checks

    const documents = await Document.find(query)
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Fetch related entity names for each document
    const documentsWithEntityNames = await Promise.all(
      documents.map(async (doc) => {
        const docObj = doc.toObject();
        let entityName = null;

        try {
          if (doc.relatedEntityType === 'contact') {
            const contact = await Contact.findById(doc.relatedEntityId);
            if (contact) {
              entityName = `${contact.firstName} ${contact.lastName}`;
            }
          } else if (doc.relatedEntityType === 'company') {
            const company = await Company.findById(doc.relatedEntityId);
            if (company) {
              entityName = company.name;
            }
          } else if (doc.relatedEntityType === 'case') {
            const case_ = await Case.findById(doc.relatedEntityId);
            if (case_) {
              entityName = case_.title;
            }
          }
        } catch (error) {
          // Entity might not exist, continue without name
          console.error(`Error fetching ${doc.relatedEntityType} ${doc.relatedEntityId}:`, error);
        }

        return {
          ...docObj,
          relatedEntityName: entityName,
        };
      })
    );

    return NextResponse.json({ success: true, data: documentsWithEntityNames });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

