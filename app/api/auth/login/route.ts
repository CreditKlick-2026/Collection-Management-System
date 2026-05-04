import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { username, password, role } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const isCorrect = user.password === hashedPassword || user.password === password;

    if (!isCorrect) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }

    // Auto-migrate to hashed password if it was plain text
    if (user.password === password && user.password !== hashedPassword) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
    }

    // Role check (Supervisor maps to manager)
    const targetRole = role === 'supervisor' ? 'manager' : role;
    if (user.role !== targetRole) {
      return NextResponse.json({ message: `Access denied. You are not registered as ${role}.` }, { status: 403 });
    }

    if (!user.active) {
      return NextResponse.json({ message: 'Account is deactivated. Contact admin.' }, { status: 403 });
    }

    // Return safe user object (no password)
    const { password: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });

  } catch (error: any) {
    console.error('[LOGIN ERROR]', error?.message || error);
    return NextResponse.json({ message: 'Database connection error. Please try again.' }, { status: 500 });
  }
}
