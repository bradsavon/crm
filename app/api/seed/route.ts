import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// This endpoint should only be used once to create the first admin user
// Consider removing or securing this after initial setup
export async function POST() {
  try {
    await connectDB();

    // Check if any admin exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin user already exists' },
        { status: 400 }
      );
    }

    // Create default admin user
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@crm.com',
      password: 'admin123',
      role: 'admin',
      isActive: true,
    });

    const adminData = admin.toObject();
    delete adminData.password;

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        email: admin.email,
        password: 'admin123', // Only returned once
        note: 'Please change the password after first login',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

