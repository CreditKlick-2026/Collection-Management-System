/**
 * PTP Auto-Broken Direct Test (No HTTP needed)
 * 
 * Yeh script directly DB se cron logic chalata hai
 * npm run dev ki zaroorat nahi hai.
 * 
 * Run: node scratch/test_ptp_cron.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Same logic jo cron mein hai ─────────────────────────────────────────
async function runCronLogic(ptpId) {
  const ptp = await prisma.pTP.findUnique({
    where: { id: ptpId },
    select: { id: true, customerId: true, date: true, status: true, remarks: true }
  });

  if (!ptp || ptp.status !== 'pending') {
    console.log(`  ⚠ PTP ${ptpId} status is already "${ptp?.status}". Skipping.`);
    return;
  }

  // Check for cleared payment on or after PTP date
  const payment = await prisma.payment.findFirst({
    where: {
      customerId: ptp.customerId,
      status: 'cleared',
      date: { gte: ptp.date }
    },
    select: { id: true }
  });

  if (payment) {
    await prisma.pTP.update({
      where: { id: ptpId },
      data: {
        status: 'paid',
        remarks: (ptp.remarks || '') + `\n[Auto] Paid via Payment #${payment.id} at ${new Date().toISOString()}`
      }
    });
    console.log(`  ✅ Marked as PAID (Payment #${payment.id} found)`);
  } else {
    await prisma.pTP.update({
      where: { id: ptpId },
      data: {
        status: 'broken',
        transferStatus: 'escalated',
        remarks: (ptp.remarks || '') + `\n[Auto-Broken] No payment found. Escalated at ${new Date().toISOString()}`
      }
    });
    console.log(`  ✅ Marked as BROKEN + ESCALATED (No payment found)`);
  }
}

async function main() {
  console.log('\n====================================');
  console.log('  PTP Auto-Broken Direct Test');
  console.log('====================================\n');

  // ── Step 1: Find a real customer & agent ──
  const customer = await prisma.customer.findFirst({ orderBy: { id: 'desc' } });
  const agent    = await prisma.user.findFirst({ where: { role: 'agent' } });

  if (!customer || !agent) {
    console.error('❌ No customer or agent found.');
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  console.log(`📋 Customer : ${customer.name} (ID: ${customer.id})`);
  console.log(`👤 Agent    : ${agent.name} (ID: ${agent.id})`);
  console.log(`📅 PTP Date : ${yesterdayStr} (yesterday — already overdue)`);

  // ── Step 2: Create test PTP ──
  const testPtp = await prisma.pTP.create({
    data: {
      customerId:      customer.id,
      amount:          9999,
      date:            yesterdayStr,
      status:          'pending',
      agentId:         agent.id,
      originalAgentId: agent.id,
      voc:             'TEST - Will pay tomorrow',
      remarks:         '[TEST] Created by test_ptp_cron.js',
      created:         new Date().toISOString().split('T')[0]
    }
  });

  console.log(`\n✅ Test PTP created — ID: ${testPtp.id}, Status: ${testPtp.status}`);

  // ── Step 3: Run cron logic directly ──
  console.log('\n⚡ Running cron logic directly...');
  await runCronLogic(testPtp.id);

  // ── Step 4: Verify result ──
  const result = await prisma.pTP.findUnique({
    where: { id: testPtp.id },
    select: { id: true, status: true, transferStatus: true, remarks: true }
  });

  console.log('\n📊 Final PTP State:');
  console.log(`   Status         : ${result?.status}`);
  console.log(`   Transfer Status: ${result?.transferStatus || 'none'}`);
  console.log(`   Remarks (last) : ...${result?.remarks?.slice(-70)}`);

  if (result?.status === 'broken' && result?.transferStatus === 'escalated') {
    console.log('\n🎉 TEST PASSED — Auto-Broken + Escalation works correctly!');
  } else if (result?.status === 'paid') {
    console.log('\n🎉 TEST PASSED — Auto-Paid works correctly!');
  } else {
    console.log('\n❌ TEST FAILED — Status did not change.');
  }

  // ── Step 5: Cleanup ──
  await prisma.pTP.delete({ where: { id: testPtp.id } });
  console.log(`\n🧹 Test PTP (ID: ${testPtp.id}) deleted. Cleanup done.`);
  console.log('\n====================================\n');
}

main()
  .catch(e => console.error('Script error:', e))
  .finally(() => prisma.$disconnect());
