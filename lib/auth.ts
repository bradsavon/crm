import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import User, { UserRole } from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(request?: NextRequest): Promise<AuthUser | null> {
  try {
    let token: string | undefined;

    if (request) {
      // Server-side: get token from cookies
      token = request.cookies.get('auth-token')?.value;
    } else {
      // Server component: get token from cookies
      const cookieStore = await cookies();
      token = cookieStore.get('auth-token')?.value;
    }

    if (!token) {
      return null;
    }

    const user = verifyToken(token);
    return user;
  } catch (error) {
    return null;
  }
}

export function requireAuth(roles?: UserRole[]): (user: AuthUser | null) => boolean {
  return (user: AuthUser | null) => {
    if (!user) {
      return false;
    }

    if (roles && roles.length > 0) {
      return roles.includes(user.role);
    }

    return true;
  };
}

export function hasPermission(user: AuthUser | null, requiredRole: UserRole): boolean {
  if (!user) return false;

  const roleHierarchy: Record<UserRole, number> = {
    admin: 3,
    manager: 2,
    salesrep: 1,
  };

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

