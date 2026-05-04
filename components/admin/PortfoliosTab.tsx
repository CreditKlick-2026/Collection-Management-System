import React, { useState } from 'react';
import { FolderPlus } from 'lucide-react';

interface PortfoliosTabProps {
  loading: boolean;
  setIsAddingPortfolio: (val: boolean) => void;
  isAddingPortfolio: boolean;
  newPortfolio: any;
  setNewPortfolio: (val: any) => void;
  handleAddPortfolio: () => void;
  portfolios: any[];
  users: any[];
  onSavePortfolio: (portfolioId: string, agentIds: number[], managerIds: number[]) => Promise<void>;
  onDeletePortfolio: (id: string) => Promise<void>;
}

const PortfoliosTab: React.FC<PortfoliosTabProps> = ({
  loading,
  setIsAddingPortfolio,
  isAddingPortfolio,
  newPortfolio,
  setNewPortfolio,
  handleAddPortfolio,
  portfolios,
  users,
  onSavePortfolio,
  onDeletePortfolio
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [localPortfolios, setLocalPortfolios] = useState<any[]>([]);

  React.useEffect(() => {
    setLocalPortfolios(portfolios);
  }, [portfolios]);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await onDeletePortfolio(id);
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const handleLocalAssignmentChange = (portfolioId: string, userId: number, role: string, isChecked: boolean) => {
    setLocalPortfolios(prev => prev.map(p => {
      if (p.id !== portfolioId) return p;
      const newP = { ...p };
      if (role === 'agent') {
        const currentAgents = newP.agents || [];
        if (isChecked) newP.agents = [...currentAgents, { id: userId }];
        else newP.agents = currentAgents.filter((a: any) => a.id !== userId);
      } else {
        const currentManagers = newP.managers || [];
        if (isChecked) newP.managers = [...currentManagers, { id: userId }];
        else newP.managers = currentManagers.filter((m: any) => m.id !== userId);
      }
      return newP;
    }));
  };

  const handleSave = async (portfolioId: string) => {
    const p = localPortfolios.find(p => p.id === portfolioId);
    if (!p) return;
    setSavingId(portfolioId);
    try {
      const agentIds = (p.agents || []).map((a: any) => a.id);
      const managerIds = (p.managers || []).map((m: any) => m.id);
      await onSavePortfolio(portfolioId, agentIds, managerIds);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 15 }}>
          <div className="skel" style={{ width: 120, height: 32, borderRadius: 6 }}></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skel" style={{ height: 120, borderRadius: 10 }}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 15 }}>
        <button 
          className="btn pr" 
          style={{ 
            borderRadius: 6, 
            padding: '8px 16px', 
            fontSize: '12px', 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }} 
          onClick={() => setIsAddingPortfolio(true)}
        >
          <FolderPlus size={14} /> Add Portfolio
        </button>
      </div>

      {isAddingPortfolio && (
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(79,125,255,0.05)', border: '1px dashed var(--acc)', padding: '12px 16px', borderRadius: 8, gap: 10, marginBottom: 15 }}>
          <input className="finp" placeholder="Portfolio ID (e.g. P4)" style={{ width: 150 }} value={newPortfolio.id} onChange={e => setNewPortfolio({ ...newPortfolio, id: e.target.value })} />
          <input className="finp" placeholder="Portfolio Name (e.g. Credit Cards)" style={{ flex: 1 }} value={newPortfolio.name} onChange={e => setNewPortfolio({ ...newPortfolio, name: e.target.value })} />
          <button className="btn pr" onClick={handleAddPortfolio}>Save</button>
          <button className="btn sm" onClick={() => setIsAddingPortfolio(false)}>Cancel</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: 20 }}>
        {localPortfolios.map(p => (
          <div key={p.id} className="card" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 14, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, background: 'var(--accbg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--acc2)' }}>{p.id}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 1 }}>{p.agents?.length || 0} Agents • {p.managers?.length || 0} Managers</div>
                </div>
              </div>

              {confirmDeleteId === p.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: 'var(--red)', fontWeight: 600 }}>Sure?</span>
                  <button
                    className="btn sm"
                    disabled={deleting}
                    style={{ background: 'rgba(226,75,74,0.15)', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.3)', padding: '4px 10px', fontSize: 10 }}
                    onClick={() => handleDelete(p.id)}
                  >
                    {deleting ? '...' : '✓ Yes'}
                  </button>
                  <button
                    className="btn sm"
                    style={{ padding: '4px 10px', fontSize: 10 }}
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    ✕ No
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn sm pr"
                    disabled={savingId === p.id}
                    style={{ padding: '5px 12px' }}
                    onClick={() => handleSave(p.id)}
                  >
                    {savingId === p.id ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    className="btn sm"
                    style={{ background: 'rgba(226,75,74,0.05)', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.1)', padding: '5px 10px' }}
                    onClick={() => setConfirmDeleteId(p.id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Body */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1 }}>
              {/* Agents Section */}
              <div style={{ padding: '20px', borderRight: '1px solid var(--bdr)' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--acc2)', letterSpacing: 0.8, marginBottom: 15, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>👥</span> ASSIGNED AGENTS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto', paddingRight: 5 }}>
                  {users.filter(u => u.role === 'agent').map(u => {
                    const isAssigned = p.agents?.some((a: any) => a.id === u.id);
                    return (
                      <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: isAssigned ? 'rgba(79,125,255,0.05)' : 'transparent', border: `1px solid ${isAssigned ? 'rgba(79,125,255,0.15)' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                        <input
                          type="checkbox"
                          style={{ accentColor: 'var(--acc)' }}
                          checked={isAssigned}
                          onChange={(e) => handleLocalAssignmentChange(p.id, u.id, 'agent', e.target.checked)}
                        />
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'var(--txt2)' }}>{u.initials}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: isAssigned ? 'var(--txt)' : 'var(--txt3)' }}>{u.name}</div>
                          <div style={{ fontSize: 9, color: 'var(--txt3)' }}>{u.empId}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Managers Section */}
              <div style={{ padding: '20px', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--amb)', letterSpacing: 0.8, marginBottom: 15, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>👔</span> ASSIGNED MANAGERS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto', paddingRight: 5 }}>
                  {users.filter(u => (u.role === 'manager' || u.role === 'admin')).map(u => {
                    const isAssigned = p.managers?.some((m: any) => m.id === u.id);
                    return (
                      <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: isAssigned ? 'rgba(245,166,35,0.05)' : 'transparent', border: `1px solid ${isAssigned ? 'rgba(245,166,35,0.15)' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                        <input
                          type="checkbox"
                          style={{ accentColor: 'var(--amb)' }}
                          checked={isAssigned}
                          onChange={(e) => handleLocalAssignmentChange(p.id, u.id, 'manager', e.target.checked)}
                        />
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'var(--txt2)' }}>{u.initials}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: isAssigned ? 'var(--txt)' : 'var(--txt3)' }}>{u.name}</div>
                          <div style={{ fontSize: 9, color: 'var(--txt3)' }}>{u.empId}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfoliosTab;
