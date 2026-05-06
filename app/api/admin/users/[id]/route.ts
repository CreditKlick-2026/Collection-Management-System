import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const data = await request.json();

    const updateData: any = {
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
    };

    if (data.password) {
      updateData.password = crypto.createHash('sha256').update(data.password).digest('hex');
    }

    if (data.name) {
      updateData.initials = data.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);
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

    // Sequential cleanup — no transaction needed for admin-only delete
    // 1. Unassign leads
    await prisma.customer.updateMany({ where: { assignedAgentId: id }, data: { assignedAgentId: null } });

    // 2. Detach subordinates
    await prisma.user.updateMany({ where: { managerId: id }, data: { managerId: null } });

    // 3. Delete audit logs (non-nullable FK)
    await prisma.auditLog.deleteMany({ where: { userId: id } });

    // 4. Delete payments/PTPs/disputes/settlements (non-nullable agentId, no cascade)
    await prisma.payment.deleteMany({ where: { agentId: id } });
    await prisma.pTP.deleteMany({ where: { agentId: id } });
    await prisma.dispute.deleteMany({ where: { agentId: id } });
    await prisma.settlement.deleteMany({ where: { agentId: id } });

    // 5. Disconnect portfolio many-to-many
    await prisma.user.update({
      where: { id },
      data: {
        portfoliosManaged: { set: [] },
        portfoliosAgent: { set: [] },
      }
    });

    // 6. Delete the user
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json({ message: 'Error deleting user: ' + error.message }, { status: 500 });
  }
}


