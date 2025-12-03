import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contact from '@/models/Contact';
import Company from '@/models/Company';
import Case from '@/models/Case';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          contacts: [],
          companies: [],
          cases: [],
        },
      });
    }

    // Create case-insensitive regex for searching
    const searchRegex = new RegExp(query.trim(), 'i');

    // Search contacts - match firstName, lastName, email, phone, company, position
    const contacts = await Contact.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { company: searchRegex },
        { position: searchRegex },
      ],
    })
      .limit(10)
      .sort({ createdAt: -1 });

    // Search companies - match name, industry, email, phone, city, state
    const companies = await Company.find({
      $or: [
        { name: searchRegex },
        { industry: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { city: searchRegex },
        { state: searchRegex },
        { website: searchRegex },
      ],
    })
      .limit(10)
      .sort({ createdAt: -1 });

    // Search cases - match title, company, contact, description
    const cases = await Case.find({
      $or: [
        { title: searchRegex },
        { company: searchRegex },
        { contact: searchRegex },
        { description: searchRegex },
      ],
    })
      .limit(10)
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: {
        contacts,
        companies,
        cases,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

