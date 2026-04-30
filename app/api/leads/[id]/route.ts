import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();

    // Clean data: convert numbers where necessary
    const updateData: any = {
      name: data.name,
      mobile: data.mobile,
      alt_mobile: data.alt_mobile,
      email: data.email,
      pan: data.pan,
      dob: data.dob,
      city: data.city,
      state: data.state,
      employer: data.employer,
      salary: data.salary ? parseFloat(data.salary) : undefined,
      address: data.address,
      outstanding: data.outstanding ? parseFloat(data.outstanding) : undefined,
      dpd: data.dpd ? parseInt(data.dpd) : undefined,
      status: data.status,
      portfolioId: data.portfolioId,
      assignedAgentId: data.assignedAgentId ? parseInt(data.assignedAgentId) : null
    };

    const lead = await prisma.customer.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json({ message: 'Error updating lead' }, { status: 500 });
  }
}
