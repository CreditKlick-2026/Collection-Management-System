import React from 'react';

interface ColumnsTabProps {
  loading: boolean;
  setIsAddingColumn: (val: boolean) => void;
  isAddingColumn: boolean;
  newColumn: any;
  setNewColumn: (val: any) => void;
  handleAddColumn: () => void;
  columns: any[];
  handleToggleVisibility: (col: any) => void;
  handleToggleProfileVisibility: (col: any) => void;
}

const ColumnsTab: React.FC<ColumnsTabProps> = ({
  loading,
  setIsAddingColumn,
  isAddingColumn,
  newColumn,
  setNewColumn,
  handleAddColumn,
  columns,
  handleToggleVisibility,
  handleToggleProfileVisibility
}) => {
  if (loading) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 15 }}>
          <div className="skel" style={{ width: 110, height: 32, borderRadius: 6 }}></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skel" style={{ height: 50, borderRadius: 8 }}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 15 }}>
        <button className="btn pr" style={{ borderRadius: 6, padding: '7px 15px', fontSize: 11 }} onClick={() => setIsAddingColumn(true)}>+ Add Column</button>
      </div>

      {isAddingColumn && (
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(79,125,255,0.05)', border: '1px dashed var(--acc)', padding: '12px 16px', borderRadius: 8, gap: 10, marginBottom: 15 }}>
          <input className="finp" placeholder="Column Name (e.g. Pin Code)" style={{ flex: 1 }} value={newColumn.label} onChange={e => setNewColumn({ ...newColumn, label: e.target.value })} />
          <select className="finp" style={{ width: 150 }} value={newColumn.type} onChange={e => setNewColumn({ ...newColumn, type: e.target.value })}>
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="boolean">Boolean</option>
          </select>
          <button className="btn pr" onClick={handleAddColumn}>Save</button>
          <button className="btn sm" onClick={() => setIsAddingColumn(false)}>Cancel</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 15 }}>
        {columns.map((col, idx) => (
          <div key={col.id} style={{ display: 'flex', alignItems: 'center', background: 'var(--bg2)', border: '1px solid var(--bdr)', padding: '12px 16px', borderRadius: 8 }}>
            <div style={{ flex: 1, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div>{col.label}</div>
              <div style={{ color: 'var(--txt3)', fontSize: 10, fontFamily: 'monospace' }}>{col.key} <span style={{ color: 'var(--acc2)', marginLeft: 5 }}>[{col.type}]</span></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--txt2)', cursor: 'pointer' }}>
                <input type="checkbox" checked={col.visible} onChange={() => handleToggleVisibility(col)} style={{ cursor: 'pointer', accentColor: 'var(--pur)' }} /> Table View
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--txt2)', cursor: 'pointer' }}>
                <input type="checkbox" checked={col.showInProfile !== false} onChange={() => handleToggleProfileVisibility(col)} style={{ cursor: 'pointer', accentColor: 'var(--acc)' }} /> Dashboard Field
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColumnsTab;
