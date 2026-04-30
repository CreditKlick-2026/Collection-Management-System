import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();

    const user = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        username: data.username,
        empId: data.empId,
        role: data.role,
        managerId: data.managerId ? parseInt(data.managerId) : null,
        email: data.email,
        contact: data.contact,
        dob: data.dob,
        doj: data.doj,
        address: data.address,
        active: data.active
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ message: 'Error updating user' }, { status: 500 });
  }
}
