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
  'eligible_for_update': 'eligible_for_update',
  'eligible for update': 'eligible_for_update',
  'pincode': 'pincode',
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
    } else if (field === 'eligible_for_update') {
      const val = String(rawValue).toLowerCase().trim();
      if (!val || val === 'no' || val === 'n' || val === 'false') {
        mapped[field] = 'N';
      } else {
        mapped[field] = 'Y';
      }
    } else {
      mapped[field] = String(rawValue).trim();
    }
  }
  return mapped;
}

export async function POST(request: Request) {
  try {
    const { data, agentId, portfolioId, duplicateHandling, fileName } = await request.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    // Create a new Background Job
    const job = await prisma.bulkUploadJob.create({
      data: {
        status: 'processing',
        totalRows: data.length,
        fileName: fileName || 'unknown_file.csv'
      }
    });

    // Start background processing (Fire and forget)
    processJobInBackground(job.id, data, agentId, portfolioId, duplicateHandling);

    return NextResponse.json({ 
      success: true, 
      jobId: job.id,
      message: 'Upload started in background' 
    });
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to start bulk upload' }, { status: 500 });
  }
}

// Background processing function
async function processJobInBackground(jobId: string, data: any[], agentId: string, portfolioId: string, duplicateHandling: string) {
  try {
    const allAgents = await prisma.user.findMany({ select: { id: true, username: true, empId: true } });
    const agentByUsername = new Map(allAgents.map(a => [a.username.toLowerCase(), a.id]));
    const agentByEmpId = new Map(allAgents.map(a => [a.empId.toLowerCase(), a.id]));

    const allPortfolios = await prisma.portfolio.findMany({ select: { id: true, name: true } });
    const portfolioByName = new Map(allPortfolios.map(p => [p.name.toLowerCase(), p.id]));
    const portfolioById = new Map(allPortfolios.map(p => [p.id.toLowerCase(), p.id]));

    let successCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process in batches to avoid locking the DB too long and update progress
    const BATCH_SIZE = 50;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      
      for (const row of batch) {
        try {
          const mapped = mapRow(row);
          const account_no = mapped['account_no'];

          if (!account_no) {
            skippedCount++;
            continue;
          }

          let resolvedAgentId: number | null = null;
          if (mapped['agentUsername']) {
            const uname = mapped['agentUsername'].toLowerCase();
            resolvedAgentId = agentByUsername.get(uname) ?? agentByEmpId.get(uname) ?? null;
            delete mapped['agentUsername'];
          } else if (agentId) {
            resolvedAgentId = parseInt(agentId) || null;
          }

          let resolvedPortfolioId: string | null = null;
          if (mapped['portfolioId']) {
            const pid = mapped['portfolioId'].toLowerCase();
            resolvedPortfolioId = portfolioById.get(pid) ?? portfolioByName.get(pid) ?? null;
            delete mapped['portfolioId'];
          } else if (portfolioId) {
            resolvedPortfolioId = portfolioId;
          }

          const { account_no: _acc, ...rest } = mapped;
          const customerData: any = { ...rest };
          if (resolvedAgentId) customerData.assignedAgentId = resolvedAgentId;
          if (resolvedPortfolioId) customerData.portfolioId = resolvedPortfolioId;

          const existing = await prisma.customer.findUnique({ where: { account_no } });

          if (existing) {
            if (duplicateHandling === 'Skip Duplicates') {
              skippedCount++;
            } else {
              await prisma.customer.update({ where: { account_no }, data: customerData });
              updatedCount++;
            }
          } else {
            if (!customerData.name) customerData.name = 'Unknown';
            if (!customerData.mobile) customerData.mobile = '0000000000';
            await prisma.customer.create({ data: { account_no, ...customerData } });
            successCount++;
          }
        } catch (rowErr: any) {
          errorCount++;
          if (errors.length < 50) errors.push(`Row ${i + 1}: ${rowErr.message}`);
        }
      }

      // Update progress in DB every batch
      await prisma.bulkUploadJob.update({
        where: { id: jobId },
        data: {
          processedRows: Math.min(i + BATCH_SIZE, data.length),
          successCount,
          updatedCount,
          skippedCount,
          errorCount,
          errors: errors as any
        }
      });
    }

    // Finalize Job
    await prisma.bulkUploadJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    });

  } catch (globalErr: any) {
    console.error('Job failure:', globalErr);
    await prisma.bulkUploadJob.update({
      where: { id: jobId },
      data: { status: 'failed', errors: [globalErr.message] as any }
    });
  }
}
