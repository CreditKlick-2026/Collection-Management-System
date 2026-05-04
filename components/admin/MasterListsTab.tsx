import React from 'react';

interface MasterListsTabProps {
  DEFAULT_LISTS: Record<string, string[]>;
  masterLists: any[];
  handleDeleteListItem: (id: number) => void;
  newListItem: any;
  setNewListItem: React.Dispatch<React.SetStateAction<any>>;
  handleAddListItem: (type: string) => void;
  toast: (msg: string) => void;
}

const MasterListsTab: React.FC<MasterListsTabProps> = ({
  DEFAULT_LISTS,
  masterLists,
  handleDeleteListItem,
  newListItem,
  setNewListItem,
  handleAddListItem,
  toast
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="info-box" style={{ background: 'rgba(79,125,255,0.05)', border: '1px solid var(--acc2)40', color: 'var(--acc2)', padding: '12px 16px', fontSize: 12, borderRadius: 8 }}>
        Admin can add or delete payment modes, PTP statuses, dispute statuses, and flag options. Changes apply system-wide immediately.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {[
          { title: 'Payment Modes', type: 'PAYMENT_MODE', placeholder: 'New payment modes item...' },
          { title: 'PTP Statuses', type: 'PTP_STATUS', placeholder: 'New ptp statuses item...' },
          { title: 'Dispute Statuses', type: 'DISPUTE_STATUS', placeholder: 'New dispute statuses item...' },
          { title: 'Flag Options', type: 'FLAG_OPTION', placeholder: 'New flag options item...' },
        ].map(section => (
          <div key={section.type} className="card" style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 15, color: 'var(--txt)' }}>{section.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Default Items */}
              {DEFAULT_LISTS[section.type].map(val => (
                <div key={`def-${val}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--bdr)', opacity: 0.7 }}>
                  <span style={{ fontSize: 13, color: 'var(--txt3)' }}>{val} <span style={{ fontSize: 9, opacity: 0.6, marginLeft: 5 }}>(Default)</span></span>
                  <div style={{ width: 30 }} /> {/* Spacer */}
                </div>
              ))}

              {/* Database Items */}
              {masterLists.filter(l => l.type === section.type).map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--acc2)40' }}>
                  <span style={{ fontSize: 13, color: section.type === 'FLAG_OPTION' ? (item.value === 'approved' ? 'var(--grn)' : item.value === 'rejected' ? 'var(--red)' : 'var(--txt2)') : 'var(--txt2)' }}>
                    {item.value}
                  </span>
                  <button onClick={() => handleDeleteListItem(item.id)} style={{ background: 'rgba(226,75,74,0.1)', color: 'var(--red)', border: '1px solid rgba(226,75,74,0.2)', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>✕</button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 5 }}>
                <input
                  className="finp"
                  placeholder={section.placeholder}
                  value={(newListItem as any)[section.type] || ''}
                  onChange={e => setNewListItem((prev: any) => ({ ...prev, [section.type]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleAddListItem(section.type)}
                />
                <button className="btn pr" onClick={() => handleAddListItem(section.type)}>+ Add</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MasterListsTab;
