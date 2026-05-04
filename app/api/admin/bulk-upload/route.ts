import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Worker } from 'worker_threads';
import uploadEventBus, { skippedStore } from '@/lib/upload-events';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export const dynamic = 'force-dynamic';

// ─── Worker Thread Script ──────────────────────────────────────────────────────
// NOTE: Uses Prisma ORM methods (NOT raw SQL) — avoids column-name casing issues.
const WORKER_SCRIPT = `
const { workerData, parentPort } = require('worker_threads');
const { PrismaClient }           = require('@prisma/client');
const fs                         = require('fs');

const FIELD_MAP = {
  'account number':'account_no','account_no':'account_no','account no':'account_no','loan account':'account_no',
  'customer name':'name','name':'name','borrower name':'name',
  'mobile number':'mobile','mobile':'mobile','phone':'mobile',
  'alt mobile':'alt_mobile','alt_mobile':'alt_mobile',
  'alt mobile 2':'alt_mobile_2','alt mobile 3':'alt_mobile_3','alt mobile 4':'alt_mobile_4',
  'pan number':'pan','pan':'pan','email':'email',
  'product type':'product','product':'product',
  'bank / lender':'bank','bank':'bank','lender':'bank',
  'total outstanding':'outstanding','outstanding':'outstanding','outstanding amount':'outstanding',
  'principle outstanding':'principle_outstanding','principal outstanding':'principle_outstanding',
  'min amount due':'min_amt_due','minimum amount due':'min_amt_due',
  'dpd':'dpd','days past due':'dpd',
  'bucket':'bkt_2','bkt_2':'bkt_2',
  'product npa':'product_npa','date of npa':'date_of_npa',
  'status':'status','city':'city','state':'state','address':'address',
  'dob':'dob','gender':'gender','employer':'employer','salary':'salary',
  'portfolio':'portfolioId','assigned agent':'agentUsername','agent':'agentUsername',
  'eligible_for_update':'eligible_for_update','eligible for update':'eligible_for_update',
  // NOTE: 'created date' / 'createdAt' intentionally NOT mapped — it is DB-managed (@default(now()))
};
const NUMBER_FIELDS = new Set(['outstanding','principle_outstanding','min_amt_due','dpd','salary']);
// Fields that exist in Customer table (used to separate from metadata)
const CUSTOMER_FIELDS = new Set([
  'account_no','name','mobile','alt_mobile','alt_mobile_2','alt_mobile_3','alt_mobile_4',
  'email','pan','product','bank','outstanding','principle_outstanding','min_amt_due','dpd',
  'bkt_2','product_npa','date_of_npa','status','city','state','address',
  'dob','gender','employer','salary','eligible_for_update',
  'portfolioId','assignedAgentId'
]);

function normalizeKey(k) { return k.toLowerCase().trim().replace(/\\s+/g, ' '); }

function mapRow(row, dynamicFieldMap) {
  const out  = {};
  const meta = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null || v === undefined || v === '') continue;
    const nk    = normalizeKey(k);
    const field = FIELD_MAP[nk];
    if (field) {
      if (NUMBER_FIELDS.has(field)) { const n = Number(v); if (!isNaN(n)) out[field] = n; }
      else if (field === 'eligible_for_update') {
        const s = String(v).toLowerCase().trim();
        out[field] = (!s || s === 'no' || s === 'n' || s === 'false') ? 'N' : 'Y';
      } else { out[field] = String(v).trim(); }
    } else if (dynamicFieldMap && dynamicFieldMap[nk]) {
      const { key, type } = dynamicFieldMap[nk];
      if (type === 'number') { const n = Number(v); if (!isNaN(n)) meta[key] = n; }
      else { meta[key] = String(v).trim(); }
    }
  }
  if (Object.keys(meta).length > 0) out['_meta'] = meta;
  return out;
}

// ── Safe batch upsert using Prisma ORM (no raw SQL column-name issues) ─────────
async function upsertBatch(prisma, rows, duplicateHandling, jobId) {
  if (!rows.length) return { inserted: 0, updated: 0, skipped: 0, skippedRecords: [] };

  const accountNos = rows.map(r => r.account_no);

  // 1. One query: find which account_nos already exist
  const existing = await prisma.customer.findMany({
    where:  { account_no: { in: accountNos } },
    select: { account_no: true }
  });
  const existingSet = new Set(existing.map(e => e.account_no));

  const toCreate = [];
  const toUpdate = [];
  const skippedRecords = [];

  for (const row of rows) {
    const { account_no, agentUsername, _meta, ...rest } = row;
    const customerData = { ...rest, bulkUploadJobId: jobId };
    if (_meta) customerData.metadata = _meta;

    // Strip DB-managed fields
    delete customerData.createdAt;
    delete customerData.updatedAt;
    delete customerData.id;

    if (existingSet.has(account_no)) {
      if (duplicateHandling === 'Skip Duplicates') {
        skippedRecords.push({ account_no, name: customerData.name || 'Unknown', reason: 'Duplicate — account already exists in DB' });
      }
      else { toUpdate.push({ account_no, customerData }); }
    } else {
      if (!customerData.name)   customerData.name   = 'Unknown';
      if (!customerData.mobile) customerData.mobile = '0000000000';
      toCreate.push({ account_no, ...customerData });
    }
  }

  let inserted = 0, updated = 0;

  // 2. Batch create new records
  if (toCreate.length > 0) {
    try {
      const r = await prisma.customer.createMany({ data: toCreate, skipDuplicates: true });
      inserted = r.count;
    } catch (e) {
      for (const row of toCreate) {
        try { await prisma.customer.create({ data: row }); inserted++; }
        catch {}
      }
    }
  }

  // 3. Parallel updates for existing records
  if (toUpdate.length > 0) {
    const results = await Promise.allSettled(
      toUpdate.map(r => prisma.customer.update({ where: { account_no: r.account_no }, data: r.customerData }))
    );
    updated = results.filter(r => r.status === 'fulfilled').length;
  }

  return { inserted, updated, skipped: skippedRecords.length, skippedRecords };
}

// ── Main job processor ────────────────────────────────────────────────────────
async function processJob() {
  const { jobId, tempFile, agentId, portfolioId, duplicateHandling } = workerData;
  const prisma = new PrismaClient();

  try {
    await prisma.bulkUploadJob.update({ where: { id: jobId }, data: { status: 'processing' } });
    parentPort && parentPort.postMessage({ type: 'status', status: 'processing' });

    // Read + delete temp file immediately to free disk
    let rawData;
    try {
      rawData = JSON.parse(fs.readFileSync(tempFile, 'utf-8'));
      fs.unlinkSync(tempFile);
    } catch(e) { throw new Error('Temp file read failed: ' + e.message); }

    // Pre-load lookup tables once
    const allAgents     = await prisma.user.findMany({ select: { id: true, username: true, empId: true } });
    const byUser        = new Map(allAgents.map(a => [a.username.toLowerCase(), a.id]));
    const byEmp         = new Map(allAgents.map(a => [a.empId.toLowerCase(), a.id]));

    const allPortfolios = await prisma.portfolio.findMany({ select: { id: true, name: true } });
    const byPName       = new Map(allPortfolios.map(p => [p.name.toLowerCase(), p.id]));
    const byPId         = new Map(allPortfolios.map(p => [p.id.toLowerCase(), p.id]));

    // Dynamic columns from LeadColumn
    const leadColumns   = await prisma.leadColumn.findMany({ select: { key: true, label: true, type: true } });
    const dynamicFieldMap = {};
    for (const col of leadColumns) {
      const entry = { key: col.key, type: col.type || 'text' };
      dynamicFieldMap[col.key.toLowerCase().trim()]                           = entry;
      dynamicFieldMap[col.label.toLowerCase().trim().replace(/\\s+/g, ' ')] = entry;
    }

    // Map ALL rows (CPU only)
    const mapped = [];
    let   skippedNoAccount = 0;
    const errors = [];

    for (const row of rawData) {
      try {
        const m = mapRow(row, dynamicFieldMap);
        if (!m['account_no']) { skippedNoAccount++; continue; }

        if (m['agentUsername']) {
          const u = m['agentUsername'].toLowerCase();
          m['assignedAgentId'] = byUser.get(u) ?? byEmp.get(u) ?? null;
          delete m['agentUsername'];
        } else if (agentId) {
          m['assignedAgentId'] = parseInt(agentId) || null;
        }

        if (m['portfolioId']) {
          const p = m['portfolioId'].toLowerCase();
          m['portfolioId'] = byPId.get(p) ?? byPName.get(p) ?? null;
        } else if (portfolioId) {
          m['portfolioId'] = portfolioId;
        }

        mapped.push(m);
      } catch(e) {
        if (errors.length < 50) errors.push('Map: ' + e.message);
      }
    }

    // Process in batches of 200
    const BATCH_SIZE  = 200;
    const CONCURRENCY = 3;
    const chunks = [];
    for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
      chunks.push(mapped.slice(i, i + BATCH_SIZE));
    }

    let successCount = 0, updatedCount = 0, skippedCount = skippedNoAccount, errorCount = errors.length;

    for (let i = 0; i < chunks.length; i += CONCURRENCY) {
      const wave = chunks.slice(i, i + CONCURRENCY);

      const results = await Promise.allSettled(
        wave.map(chunk => upsertBatch(prisma, chunk, duplicateHandling, jobId))
      );

      for (const res of results) {
        if (res.status === 'fulfilled') {
          successCount += res.value.inserted;
          updatedCount += res.value.updated;
          skippedCount += res.value.skipped;
          // Send skipped record details to parent for storage
          if (res.value.skippedRecords && res.value.skippedRecords.length > 0) {
            parentPort && parentPort.postMessage({ type: 'skipped_batch', records: res.value.skippedRecords });
          }
        } else {
          errorCount++;
          if (errors.length < 50) errors.push('Batch: ' + res.reason?.message);
        }
      }

      const processed = Math.min((i + CONCURRENCY) * BATCH_SIZE, mapped.length);

      // Update DB progress
      await prisma.bulkUploadJob.update({
        where: { id: jobId },
        data:  { processedRows: processed, successCount, updatedCount, skippedCount, errorCount, errors }
      });

      // Push real-time progress event to parent (→ EventBus → SSE client)
      parentPort && parentPort.postMessage({
        type: 'progress',
        processed,
        total:        rawData.length,
        successCount,
        updatedCount,
        skippedCount,
        errorCount,
        errors:       errors.slice(-3)
      });
    }

    // Finalize
    await prisma.bulkUploadJob.update({
      where: { id: jobId },
      data:  { status: 'completed', completedAt: new Date() }
    });

    parentPort && parentPort.postMessage({ type: 'done', successCount, updatedCount, skippedCount, errorCount });

  } catch(fatal) {
    console.error('[BulkUpload Worker] Fatal:', fatal.message);
    await prisma.bulkUploadJob.update({
      where: { id: jobId },
      data:  { status: 'failed', errors: [fatal.message] }
    }).catch(() => {});
    parentPort && parentPort.postMessage({ type: 'error', message: fatal.message });
  } finally {
    await prisma.$disconnect();
  }
}

processJob();
`;
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { data, agentId, portfolioId, duplicateHandling, fileName } = await request.json();

    if (!data?.length) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    const tempFile = path.join(os.tmpdir(), `bulk-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
    fs.writeFileSync(tempFile, JSON.stringify(data), 'utf-8');

    const job = await prisma.bulkUploadJob.create({
      data: { status: 'pending', totalRows: data.length, fileName: fileName || 'upload.xlsx' }
    });

    spawnWorker(job.id, tempFile, agentId, portfolioId, duplicateHandling);

    return NextResponse.json({ success: true, jobId: job.id });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function spawnWorker(jobId: string, tempFile: string, agentId: string, portfolioId: string, duplicateHandling: string) {
  const worker = new Worker(WORKER_SCRIPT, {
    eval: true,
    workerData: { jobId, tempFile, agentId, portfolioId, duplicateHandling }
  });

  // Forward all worker messages → global EventBus → SSE clients
  worker.on('message', (msg) => {
    // Collect skipped records into process-level store
    if (msg.type === 'skipped_batch' && msg.records) {
      const existing = skippedStore.get(jobId) || [];
      existing.push(...msg.records);
      skippedStore.set(jobId, existing);
      return; // don't forward raw skipped data to SSE (too large)
    }

    uploadEventBus.emit(`job:${jobId}`, msg);
    if (msg.type === 'done') {
      console.log(`[Job ${jobId}] Done — +${msg.successCount} new, ~${msg.updatedCount} updated, ${skippedStore.get(jobId)?.length || 0} skipped`);
      // Auto-cleanup skipped store after 1 hour
      setTimeout(() => { skippedStore.delete(jobId); }, 60 * 60 * 1000);
    }
    if (msg.type === 'error') {
      console.error(`[Job ${jobId}] Failed:`, msg.message);
      skippedStore.delete(jobId);
    }
  });

  worker.on('error', async (err) => {
    console.error(`[Job ${jobId}] Worker crash:`, err);
    try { fs.unlinkSync(tempFile); } catch {}
    uploadEventBus.emit(`job:${jobId}`, { type: 'error', message: `Worker crash: ${err.message}` });
    await prisma.bulkUploadJob.update({
      where: { id: jobId },
      data:  { status: 'failed', errors: [`Worker crash: ${err.message}`] as any }
    }).catch(() => {});
  });

  worker.on('exit', (code) => {
    if (code !== 0) console.error(`[Job ${jobId}] Worker exited code ${code}`);
  });
}
