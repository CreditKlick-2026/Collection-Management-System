import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
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
        active: data.active,
        ...(data.password && { password: data.password })
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ message: 'Error updating user' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    // Check if user has any dependencies (e.g. leads assigned, or manager of others)
    // For now, we try to delete, Prisma will throw if there's a constraint
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Delete error:', error);
    if (error.code === 'P2003') {
      return NextResponse.json({ message: 'Cannot delete user: This user has assigned leads or is a manager. Please reassign their records first.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error deleting user' }, { status: 500 });
  }
}
