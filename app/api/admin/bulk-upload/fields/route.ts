import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Canonical list of built-in Customer schema fields accepted during bulk upload.
 * Each entry has a human-readable label, the accepted Excel header variants (keys),
 * the internal DB field name, and whether it's required.
 *
 * This is the single source of truth for both the frontend guide and column-match logic.
 */
const STATIC_FIELD_DEFS = [
  { label: 'Account Number',        field: 'account_no',            required: true,  keys: ['account number','account_no','account no','loan account','accno','accountnumber','loanid','customerid'] },
  { label: 'Customer Name',         field: 'name',                  required: false, keys: ['customer name','name','borrower name','customername','borrowername'] },
  { label: 'Mobile Number',         field: 'mobile',                required: false, keys: ['mobile number','mobile','phone','mobilenumber'] },
  { label: 'Alt Mobile',            field: 'alt_mobile',            required: false, keys: ['alt mobile','alt_mobile','altmobile'] },
  { label: 'Alt Mobile 2',          field: 'alt_mobile_2',          required: false, keys: ['alt mobile 2','alt_mobile_2','altmobile2'] },
  { label: 'Alt Mobile 3',          field: 'alt_mobile_3',          required: false, keys: ['alt mobile 3','alt_mobile_3','altmobile3'] },
  { label: 'Alt Mobile 4',          field: 'alt_mobile_4',          required: false, keys: ['alt mobile 4','alt_mobile_4','altmobile4'] },
  { label: 'Email',                 field: 'email',                 required: false, keys: ['email'] },
  { label: 'PAN Number',            field: 'pan',                   required: false, keys: ['pan number','pan','pannumber'] },
  { label: 'Product Type',          field: 'product',               required: false, keys: ['product type','product','producttype'] },
  { label: 'Bank / Lender',         field: 'bank',                  required: false, keys: ['bank / lender','bank','lender','banklender'] },
  { label: 'Total Outstanding',     field: 'outstanding',           required: false, keys: ['total outstanding','outstanding','outstanding amount','totaloutstanding','outstandingamount'] },
  { label: 'Principle Outstanding', field: 'principle_outstanding', required: false, keys: ['principle outstanding','principal outstanding','principleoutstanding','principaloutstanding'] },
  { label: 'Min Amount Due',        field: 'min_amt_due',           required: false, keys: ['min amount due','minimum amount due','minamountdue','minamtdue'] },
  { label: 'DPD',                   field: 'dpd',                   required: false, keys: ['dpd','days past due','dayspastdue'] },
  { label: 'Bucket',                field: 'bkt_2',                 required: false, keys: ['bucket','bkt_2','bkt2'] },
  { label: 'Product NPA',           field: 'product_npa',           required: false, keys: ['product npa','product_npa','productnpa'] },
  { label: 'Date of NPA',           field: 'date_of_npa',           required: false, keys: ['date of npa','date_of_npa','dateofnpa'] },
  { label: 'Status',                field: 'status',                required: false, keys: ['status'] },
  { label: 'City',                  field: 'city',                  required: false, keys: ['city'] },
  { label: 'State',                 field: 'state',                 required: false, keys: ['state'] },
  { label: 'Address',               field: 'address',               required: false, keys: ['address'] },
  { label: 'Date of Birth',         field: 'dob',                   required: false, keys: ['dob','date of birth','dateofbirth'] },
  { label: 'Gender',                field: 'gender',                required: false, keys: ['gender'] },
  { label: 'Employer',              field: 'employer',              required: false, keys: ['employer'] },
  { label: 'Salary',                field: 'salary',                required: false, keys: ['salary'] },
  { label: 'Portfolio',             field: 'portfolioId',           required: false, keys: ['portfolio','portfolioid'] },
  { label: 'Assigned Agent',        field: 'agentUsername',         required: false, keys: ['assigned agent','agent','agentusername','assignedagent'] },
  { label: 'Eligible For Update',   field: 'eligible_for_update',   required: false, keys: ['eligible_for_update','eligible for update','eligibleforupdate'] },
  { label: 'Pincode',               field: 'pincode',               required: false, keys: ['pincode'] },
];

export async function GET() {
  try {
    // Dynamic columns from LeadColumn table
    const customColumns = await prisma.leadColumn.findMany({
      orderBy: { order: 'asc' },
      select: { id: true, key: true, label: true, type: true }
    });

    return NextResponse.json({
      staticFields:  STATIC_FIELD_DEFS,
      customFields:  customColumns,   // go into customer.metadata JSON
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
