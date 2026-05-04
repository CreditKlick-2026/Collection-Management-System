import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const agent = await prisma.user.findFirst({ where: { username: 'agent1' } });
    if (!agent) return NextResponse.json({ error: 'Agent not found' });
    
    // Assign 10 unassigned leads to agent1 for testing
    const unassignedLeads = await prisma.customer.findMany({
      where: { assignedAgentId: null },
      take: 10
    });

    if (unassignedLeads.length > 0) {
      await prisma.customer.updateMany({
        where: { id: { in: unassignedLeads.map(l => l.id) } },
        data: { assignedAgentId: agent.id }
      });
    }

    const leadsNow = await prisma.customer.count({ where: { assignedAgentId: agent.id } });
    
    return NextResponse.json({ 
      message: `Successfully assigned ${unassignedLeads.length} leads to agent1.`,
      totalLeadsForAgent: leadsNow
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
