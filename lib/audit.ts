import prisma from './prisma';

export async function logAudit({
  userId,
  action,
  entityType,
  entityId,
  details
}: {
  userId: number;
  action: string;
  entityType: string;
  entityId: string;
  details?: any;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details: details ? JSON.parse(JSON.stringify(details)) : null
      }
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
