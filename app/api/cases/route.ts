import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Case from '@/models/Case';

export async function GET() {
  try {
    await connectDB();
    const cases = await Case.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: cases });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const case_ = await Case.create(body);
    return NextResponse.json({ success: true, data: case_ }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

