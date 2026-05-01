import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const FIELD_MAP: Record<string, string> = {
  // Account
  'account number': 'account_no',
  'account_no': 'account_no',
  'account no': 'account_no',
  'loan account': 'account_no',
  // Name
  'customer name': 'name',
  'name': 'name',
  'borrower name': 'name',
  // Mobile
  'mobile number': 'mobile',
  'mobile': 'mobile',
  'phone': 'mobile',
  // Alt mobiles
  'alt mobile': 'alt_mobile',
  'alt_mobile': 'alt_mobile',
  'alt mobile 2': 'alt_mobile_2',
  'alt mobile 3': 'alt_mobile_3',
  'alt mobile 4': 'alt_mobile_4',
  // PAN
  'pan number': 'pan',
  'pan': 'pan',
  // Email
  'email': 'email',
  // Product
  'product type': 'product',
  'product': 'product',
  // Bank
  'bank / lender': 'bank',
  'bank': 'bank',
  'lender': 'bank',
  // Financials
  'total outstanding': 'outstanding',
  'outstanding': 'outstanding',
  'outstanding amount': 'outstanding',
  'principle outstanding': 'principle_outstanding',
  'principal outstanding': 'principle_outstanding',
  'min amount due': 'min_amt_due',
  'minimum amount due': 'min_amt_due',
  // DPD
  'dpd': 'dpd',
  'days past due': 'dpd',
  // Bucket
  'bucket': 'bkt_2',
  'bkt_2': 'bkt_2',
  // NPA
  'product npa': 'product_npa',
  'date of npa': 'date_of_npa',
  // Status
  'status': 'status',
  // Location
  'city': 'city',
  'state': 'state',
  'address': 'address',
  // Personal
  'dob': 'dob',
  'gender': 'gender',
  'employer': 'employer',
  'salary': 'salary',
  // Assignment
  'portfolio': 'portfolioId',
  'assigned agent': 'agentUsername',
  'agent': 'agentUsername',
  // Dates
  'created date': 'createdAt',
  'createdat': 'createdAt',
};

const NUMBER_FIELDS = new Set(['outstanding', 'principle_outstanding', 'min_amt_due', 'dpd', 'salary']);
const STRING_FIELDS = new Set([
  'account_no', 'name', 'mobile', 'alt_mobile', 'alt_mobile_2', 'alt_mobile_3', 'alt_mobile_4',
  'email', 'pan', 'product', 'bank', 'bkt_2', 'product_npa', 'date_of_npa', 'status',
  'city', 'state', 'address', 'dob', 'gender', 'employer', 'linkage', 'upgrade_reason',
  'eligible_upgrade', 'portfolioId', 'agentUsername', 'createdAt'
]);

function normalizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/\s+/g, ' ');
}

function mapRow(row: Record<string, any>): Record<string, any> {
  const mapped: Record<string, any> = {};
  for (const [rawKey, rawValue] of Object.entries(row)) {
    const normalized = normalizeKey(rawKey);
    const field = FIELD_MAP[normalized];
    if (!field || rawValue === null || rawValue === undefined || rawValue === '') continue;

    if (NUMBER_FIELDS.has(field)) {
      const num = Number(rawValue);
      if (!isNaN(num)) mapped[field] = num;
    } else {
      mapped[field] = String(rawValue).trim();
    }
  }
  return mapped;
}

export async function POST(request: Request) {
  try {
    const { data, agentId, portfolioId, duplicateHandling } = await request.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    // Lookup maps for agent username -> id
    const allAgents = await prisma.user.findMany({ select: { id: true, username: true, empId: true } });
    const agentByUsername = new Map(allAgents.map(a => [a.username.toLowerCase(), a.id]));
    const agentByEmpId = new Map(allAgents.map(a => [a.empId.toLowerCase(), a.id]));

    const allPortfolios = await prisma.portfolio.findMany({ select: { id: true, name: true } });
    const portfolioByName = new Map(allPortfolios.map(p => [p.name.toLowerCase(), p.id]));
    const portfolioById = new Map(allPortfolios.map(p => [p.id.toLowerCase(), p.id]));

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of data) {
      try {
        const mapped = mapRow(row);
        const account_no = mapped['account_no'];

        if (!account_no) {
          skipped++;
          continue;
        }

        // Resolve agent
        let resolvedAgentId: number | null = null;
        if (mapped['agentUsername']) {
          const uname = mapped['agentUsername'].toLowerCase();
          resolvedAgentId = agentByUsername.get(uname) ?? agentByEmpId.get(uname) ?? null;
          delete mapped['agentUsername'];
        } else if (agentId) {
          resolvedAgentId = parseInt(agentId) || null;
        }

        // Resolve portfolio
        let resolvedPortfolioId: string | null = null;
        if (mapped['portfolioId']) {
          const pid = mapped['portfolioId'].toLowerCase();
          resolvedPortfolioId = portfolioById.get(pid) ?? portfolioByName.get(pid) ?? null;
          delete mapped['portfolioId'];
        } else if (portfolioId) {
          resolvedPortfolioId = portfolioId;
        }

        // Build final customer data
        const { account_no: _acc, ...rest } = mapped;
        const customerData: any = { ...rest };
        if (resolvedAgentId) customerData.assignedAgentId = resolvedAgentId;
        if (resolvedPortfolioId) customerData.portfolioId = resolvedPortfolioId;

        const existing = await prisma.customer.findUnique({ where: { account_no } });

        if (existing) {
          if (duplicateHandling === 'Skip Duplicates') {
            skipped++;
          } else if (duplicateHandling === 'Update Existing') {
            // Update all fields from file
            await prisma.customer.update({
              where: { account_no },
              data: customerData
            });
            updated++;
          } else if (duplicateHandling === 'Update Missing Fields Only') {
            // Only fill in null/empty fields
            const updateData: any = {};
            for (const [key, value] of Object.entries(customerData)) {
              const existingValue = (existing as any)[key];
              if ((existingValue === null || existingValue === undefined || existingValue === '') && value) {
                updateData[key] = value;
              }
            }
            if (Object.keys(updateData).length > 0) {
              await prisma.customer.update({ where: { account_no }, data: updateData });
              updated++;
            } else {
              skipped++;
            }
          }
        } else {
          // New record — name and mobile are required
          if (!customerData.name) customerData.name = 'Unknown';
          if (!customerData.mobile) customerData.mobile = '0000000000';

          await prisma.customer.create({ data: { account_no, ...customerData } });
          imported++;
        }
      } catch (rowErr: any) {
        errors.push(`Row error: ${rowErr.message}`);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      updated,
      skipped,
      total: data.length,
      errors: errors.slice(0, 10) // max 10 error messages
    });
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process bulk upload' }, { status: 500 });
  }
}
