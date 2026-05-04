import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Helper to hash password using SHA-256
function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: Request) {
  try {
    const { users } = await request.json();
    
    if (!users || !Array.isArray(users)) {
      return NextResponse.json({ message: 'Invalid data format' }, { status: 400 });
    }

    let successCount = 0;
    const errors = [];

    // Process one by one to handle individual errors (e.g. duplicate username/empId)
    for (const userData of users) {
      try {
        const { password, managerEmpId, ...rest } = userData;
        
        let managerId = null;
        if (managerEmpId) {
          const mgr = await prisma.user.findUnique({
            where: { empId: managerEmpId },
            select: { id: true }
          });
          if (mgr) managerId = mgr.id;
        }

        // Hash password before saving
        const hashedPassword = hashPassword(password);
        
        // Generate initials
        const initials = rest.name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase();

        await prisma.user.create({
          data: {
            ...rest,
            password: hashedPassword,
            initials: initials || '??',
            active: true,
            managerId: managerId
          }
        });
        successCount++;
      } catch (err: any) {
        errors.push(`User ${userData.username}: ${err.message}`);
      }
    }

    return NextResponse.json({ 
      count: successCount, 
      errors: errors.length > 0 ? errors : undefined 
    });
  } catch (error) {
    console.error("BULK USER CREATE ERROR:", error);
    return NextResponse.json({ message: 'Error processing bulk upload' }, { status: 500 });
  }
}
