import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DEFAULT_COLUMNS = [
  { key: 'account_no',            label: 'Account Number',        order: 1,  type: 'text',   visible: true, showInProfile: true  },
  { key: 'name',                  label: 'Customer Name',         order: 2,  type: 'text',   visible: true, showInProfile: true  },
  { key: 'mobile',                label: 'Mobile Number',         order: 3,  type: 'text',   visible: true, showInProfile: true  },
  { key: 'dpd',                   label: 'DPD',                   order: 4,  type: 'text',   visible: true, showInProfile: true  },
  { key: 'product',               label: 'Product Type',          order: 5,  type: 'text',   visible: true, showInProfile: true  },
  { key: 'bank',                  label: 'Bank / Lender',         order: 6,  type: 'text',   visible: true, showInProfile: true  },
  { key: 'status',                label: 'Status',                order: 7,  type: 'badge',  visible: true, showInProfile: true  },
  { key: 'outstanding',           label: 'Total Outstanding',     order: 8,  type: 'amount', visible: true, showInProfile: true  },
  { key: 'city',                  label: 'City',                  order: 9,  type: 'text',   visible: true, showInProfile: true  },
  { key: 'state',                 label: 'State',                 order: 10, type: 'text',   visible: true, showInProfile: true  },
  { key: 'email',                 label: 'Email',                 order: 11, type: 'text',   visible: false, showInProfile: true },
  { key: 'alt_mobile',            label: 'Alt Mobile',            order: 12, type: 'text',   visible: false, showInProfile: true },
  { key: 'address',               label: 'Address',               order: 13, type: 'text',   visible: false, showInProfile: true },
  { key: 'min_amt_due',           label: 'Min Amount Due',        order: 14, type: 'amount', visible: false, showInProfile: true },
  { key: 'principle_outstanding', label: 'Principle Outstanding', order: 15, type: 'amount', visible: false, showInProfile: true },
  { key: 'pan',                   label: 'PAN Number',            order: 16, type: 'text',   visible: false, showInProfile: true },
  { key: 'bkt_2',                 label: 'Bucket',                order: 17, type: 'text',   visible: false, showInProfile: true },
  { key: 'product_npa',           label: 'Product NPA',           order: 18, type: 'text',   visible: false, showInProfile: true },
  { key: 'date_of_npa',           label: 'Date of NPA',           order: 19, type: 'date',   visible: false, showInProfile: true },
  { key: 'eligible_upgrade',      label: 'Eligible for Upgrade',  order: 20, type: 'text',   visible: false, showInProfile: true },
  { key: 'createdAt',             label: 'Allocation Date',       order: 21, type: 'date',   visible: false, showInProfile: true },
  { key: 'assignedAgent',         label: 'Assigned Agent',        order: 22, type: 'text',   visible: true, showInProfile: true  },
];

export async function GET() {
  try {
    let columns = await prisma.leadColumn.findMany({
      orderBy: { order: 'asc' }
    });

    // Auto-seed if table is empty
    if (columns.length === 0) {
      await prisma.leadColumn.createMany({
        data: DEFAULT_COLUMNS,
        skipDuplicates: true,
      });
      columns = await prisma.leadColumn.findMany({
        orderBy: { order: 'asc' }
      });
    }

    return NextResponse.json(columns);
  } catch (error) {
    console.error('Error fetching columns:', error);
    return NextResponse.json({ message: 'Error fetching columns' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const column = await prisma.leadColumn.create({ data });
    return NextResponse.json(column);
  } catch (error) {
    return NextResponse.json({ message: 'Error creating column' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const column = await prisma.leadColumn.update({
      where: { id },
      data
    });
    return NextResponse.json(column);
  } catch (error) {
    return NextResponse.json({ message: 'Error updating column' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });
    
    await prisma.leadColumn.delete({
      where: { id: Number(id) }
    });
    return NextResponse.json({ message: 'Column deleted' });
  } catch (error) {
    return NextResponse.json({ message: 'Error deleting column' }, { status: 500 });
  }
}
