import React from 'react';

interface BulkUploadTabProps {
  loading: boolean;
  setShowHistoryModal: (open: boolean) => void;
  fetchUploadHistory: () => void;
  handleDownloadTemplate: () => void;
  uploadFile: File | null;
  handleFileSelect: (file: File | null) => void;
  previewRows: any[];
  handleReset: () => void;
  validationError: string | null;
  previewHeaders: string[];
  uploadFields: any;
  uploadResult: any;
  uploading: boolean;
  uploadPortfolio: string;
  setUploadPortfolio: (id: string) => void;
  portfolios: any[];
  duplicateHandling: string;
  setDuplicateHandling: (handling: string) => void;
  handleCheckColumns: () => void;
  handleStartUpload: () => void;
  columnMatchResult: any;
  setColumnMatchResult: (res: any) => void;
}

const BulkUploadTab: React.FC<BulkUploadTabProps> = ({
  loading,
  setShowHistoryModal,
  fetchUploadHistory,
  handleDownloadTemplate,
  uploadFile,
  handleFileSelect,
  previewRows,
  handleReset,
  validationError,
  previewHeaders,
  uploadFields,
  uploadResult,
  uploading,
  uploadPortfolio,
  setUploadPortfolio,
  portfolios,
  duplicateHandling,
  setDuplicateHandling,
  handleCheckColumns,
  handleStartUpload,
  columnMatchResult,
  setColumnMatchResult
}) => {
  if (loading) {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 25 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="skel" style={{ width: 300, height: 24, marginBottom: 10, borderRadius: 4 }}></div>
            <div className="skel" style={{ width: 500, height: 16, borderRadius: 4 }}></div>
          </div>
          <div className="skel" style={{ width: 180, height: 40, borderRadius: 8 }}></div>
        </div>
        <div className="skel" style={{ height: 200, borderRadius: 12 }}></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="skel" style={{ height: 300, borderRadius: 12 }}></div>
          <div className="skel" style={{ height: 300, borderRadius: 12 }}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, background: 'var(--bg2)', padding: '24px 30px', borderRadius: 12, border: '1px solid var(--bdr)' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--txt)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>📤</span> Bulk Upload — Customer Data
          </div>
          <div style={{ fontSize: 13, color: 'var(--txt3)', marginTop: 6, opacity: 0.8 }}>Import leads from Excel (.xlsx) or CSV files directly into the database</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => {
              setShowHistoryModal(true);
              fetchUploadHistory();
            }}
            className="btn"
            style={{ background: 'var(--bg3)', color: 'var(--txt)', border: '1px solid var(--bdr)', padding: '12px 20px', borderRadius: 10, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            📋 Upload History
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="btn"
            style={{ background: 'var(--accbg)', color: 'var(--acc2)', border: '1px solid var(--acc)', padding: '12px 20px', borderRadius: 10, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            📥 Download Sample Template
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 25 }}>
        {/* Upload Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <label style={{ border: `2px dashed ${uploadFile ? 'var(--grn)' : 'var(--bdr)'}`, borderRadius: 16, padding: '60px 40px', textAlign: 'center', cursor: 'pointer', background: uploadFile ? 'rgba(46,204,138,0.03)' : 'var(--bg2)', display: 'block', transition: 'all 0.3s ease', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <input type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={(e) => handleFileSelect(e.target.files?.[0] || null)} />
            {uploadFile ? (
              <div style={{ animation: 'scaleIn 0.3s ease' }}>
                <div style={{ fontSize: 48, marginBottom: 15 }}>📄</div>
                <div style={{ fontWeight: 800, color: 'var(--grn)', fontSize: 18 }}>{uploadFile.name}</div>
                <div style={{ color: 'var(--txt3)', fontSize: 13, marginTop: 8, fontWeight: 500 }}>
                  {(uploadFile.size / 1024).toFixed(1)} KB · {previewRows.length > 0 ? `${previewRows.length}+ rows detected` : 'Parsing file...'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 15, marginTop: 20 }}>
                  <button onClick={(e) => { e.preventDefault(); handleReset(); }} style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.2)', color: 'var(--red)', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>Remove File</button>
                </div>
              </div>
            ) : (
              <div style={{ animation: 'fadeIn 0.5s ease' }}>
                <div style={{ fontSize: 56, marginBottom: 15, opacity: 0.8 }}>📁</div>
                <div style={{ fontWeight: 800, color: 'var(--txt)', fontSize: 18, marginBottom: 8 }}>Click to select or drag & drop</div>
                <div style={{ color: 'var(--txt3)', fontSize: 13, fontWeight: 500 }}>Supports CSV and Excel files (.csv, .xlsx, .xls)</div>
              </div>
            )}
          </label>

          {validationError && (
            <div style={{ background: 'rgba(226,75,74,0.08)', border: '1px solid var(--red)', borderRadius: 12, padding: '20px 24px', color: 'var(--red)', animation: 'slideIn 0.3s ease' }}>
              <div style={{ fontWeight: 800, marginBottom: 8, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}><span>❌</span> Validation Error</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.9 }}>{validationError}</div>
            </div>
          )}

          {previewRows.length > 0 && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, overflow: 'hidden', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bdr)', fontSize: 13, fontWeight: 700, color: 'var(--txt)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between' }}>
                <span>File Preview (First 5 Rows)</span>
                <span style={{ fontSize: 11, color: 'var(--txt3)', fontWeight: 400 }}>{previewHeaders.length} columns detected</span>
              </div>
              <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                <table className="tbl" style={{ width: 'max-content', minWidth: '100%', fontSize: 12 }}>
                  <thead style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <tr>
                      {Array.from(new Set([...previewHeaders, ...uploadFields.customFields.map((c: any) => c.label)])).map((h, i) => (
                        <th key={i} style={{ whiteSpace: 'nowrap', padding: '12px 18px', fontSize: 11, textAlign: 'left', color: 'var(--txt3)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        {Array.from(new Set([...previewHeaders, ...uploadFields.customFields.map((c: any) => c.label)])).map((h, j) => (
                          <td key={j} style={{ whiteSpace: 'nowrap', padding: '12px 18px', color: 'var(--txt2)', borderRight: '1px solid rgba(255,255,255,0.03)' }}>
                            {row[h] ?? <span style={{ opacity: 0.3 }}>—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {uploadResult && !uploading && (
            <div style={{ background: uploadResult.success ? 'rgba(46,204,138,0.08)' : 'rgba(226,75,74,0.08)', border: `1px solid ${uploadResult.success ? 'var(--grn)' : 'var(--red)'}`, borderRadius: 12, padding: '30px', animation: 'scaleIn 0.3s ease' }}>
              {uploadResult.success ? (
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--grn)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}><span>✅</span> Upload Successfully Completed</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                    {[['Total Records', uploadResult.total, '#fff'], ['Successfully Imported', uploadResult.imported, 'var(--grn)'], ['Existing Updated', uploadResult.updated, 'var(--acc2)'], ['Duplicate Skipped', uploadResult.skipped, 'var(--txt3)']].map(([label, val, color]) => (
                      <div key={label as string} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '20px 15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: color as string }}>{val as number}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label as string}</div>
                      </div>
                    ))}
                  </div>
                  <button className="btn pr" style={{ marginTop: 25, padding: '12px 25px', borderRadius: 10, fontWeight: 700 }} onClick={handleReset}>Upload Another Dataset</button>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--red)', marginBottom: 12, fontSize: 18 }}>❌ Import Failed</div>
                  <div style={{ fontSize: 14, color: 'var(--txt2)', lineHeight: 1.6 }}>{uploadResult.error}</div>
                  <button className="btn" style={{ marginTop: 20, padding: '10px 20px', background: 'var(--red)', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 700 }} onClick={handleReset}>Try Again</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 25 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, padding: '24px' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--txt)', marginBottom: 20, letterSpacing: 0.5 }}>IMPORT CONFIGURATION</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="ff">
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt3)', marginBottom: 8, display: 'block' }}>ASSIGN TO PORTFOLIO</label>
                  <select className="finp" style={{ height: 45, borderRadius: 10 }} value={uploadPortfolio} onChange={e => setUploadPortfolio(e.target.value)}>
                    <option value="">— Auto Detect from File —</option>
                    {portfolios.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="ff">
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt3)', marginBottom: 8, display: 'block' }}>DUPLICATE HANDLING</label>
                  <select className="finp" style={{ height: 45, borderRadius: 10 }} value={duplicateHandling} onChange={e => setDuplicateHandling(e.target.value)}>
                    <option value="Skip Duplicates">Skip Duplicates (Fastest)</option>
                    <option value="Update Existing">Overwrite Existing Data</option>
                  </select>
                </div>
                <button
                  className="btn"
                  onClick={handleCheckColumns}
                  disabled={!uploadFile}
                  style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', color: 'var(--acc2)', fontWeight: 700, padding: '12px', borderRadius: 10, opacity: !uploadFile ? 0.5 : 1 }}
                >
                  🔍 Check Column Match Status
                </button>
              </div>
            </div>
            <button
              className="btn pr"
              style={{ height: 60, fontSize: 16, background: 'var(--acc)', borderRadius: 12, fontWeight: 800, opacity: (!uploadFile || uploading || !!validationError) ? 0.4 : 1 }}
              onClick={handleStartUpload}
              disabled={!uploadFile || uploading || !!validationError}
            >
              {uploading ? '⌛ Processing Data...' : '🚀 Start Bulk Import'}
            </button>
          </div>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, padding: '24px', display: 'flex', flexDirection: 'column' }}>
            {columnMatchResult ? (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--txt)' }}>📊 Column Match Report</div>
                  <button className="btn sm" onClick={() => setColumnMatchResult(null)} style={{ padding: '4px 10px', fontSize: 10, background: 'var(--bg3)', border: '1px solid var(--bdr)', color: 'var(--txt3)' }}>← Back to Guide</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                  {[
                    { label: 'Matched', value: columnMatchResult.report.filter((r: any) => r.matched).length, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
                    { label: 'Missing', value: columnMatchResult.report.filter((r: any) => !r.matched).length, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
                    { label: 'Custom', value: columnMatchResult.metadataCols?.length || 0, color: 'var(--acc2)', bg: 'rgba(79,125,255,0.08)' },
                    { label: 'Unknown', value: columnMatchResult.ignoredCols?.length || 0, color: 'var(--red)', bg: 'rgba(226,75,74,0.08)' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center', padding: '10px 6px', borderRadius: 8, background: s.bg, border: `1px solid ${s.color}20` }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: s.color, letterSpacing: 0.8, marginTop: 2 }}>{s.label.toUpperCase()}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 380, overflowY: 'auto', paddingRight: 6 }}>
                  {/* Matched */}
                  {columnMatchResult.report.filter((r: any) => r.matched).length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#22c55e', letterSpacing: 1, marginBottom: 6 }}>✅ MATCHED</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {columnMatchResult.report.filter((r: any) => r.matched).map((item: any) => (
                          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(34,197,94,0.04)', padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(34,197,94,0.12)' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#2ecca7' }}>{item.label}</span>
                            <span style={{ fontSize: 10, color: 'var(--txt3)', fontFamily: 'monospace' }}>← {item.fileHeader}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing */}
                  {columnMatchResult.report.filter((r: any) => !r.matched).length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', letterSpacing: 1, marginBottom: 6 }}>⚠️ MISSING FROM EXCEL</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {columnMatchResult.report.filter((r: any) => !r.matched).map((item: any) => (
                          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(245,158,11,0.04)', padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(245,158,11,0.12)' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#f5a623' }}>{item.label}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b' }}>NOT IN FILE</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom */}
                  {columnMatchResult.metadataCols?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--acc2)', letterSpacing: 1, marginBottom: 6 }}>✦ CUSTOM COLUMNS</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {columnMatchResult.metadataCols.map((col: string) => (
                          <span key={col} style={{ fontSize: 10, background: 'rgba(79,125,255,0.08)', padding: '5px 10px', borderRadius: 6, color: 'var(--acc2)', border: '1px solid rgba(79,125,255,0.2)', fontWeight: 600 }}>{col}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ignored */}
                  {columnMatchResult.ignoredCols?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--red)', letterSpacing: 1, marginBottom: 6 }}>❌ UNRECOGNIZED</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {columnMatchResult.ignoredCols.map((col: string) => (
                          <span key={col} style={{ fontSize: 10, background: 'rgba(226,75,74,0.06)', padding: '5px 10px', borderRadius: 6, color: 'var(--red)', border: '1px solid rgba(226,75,74,0.15)', fontWeight: 600 }}>{col}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--txt)', marginBottom: 16, letterSpacing: 0.5 }}>ACCEPTED COLUMN HEADERS</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto', paddingRight: 10 }}>
                  {uploadFields.staticFields.map((f: any) => (
                    <div key={f.field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '9px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontFamily: 'monospace', color: f.required ? 'var(--grn)' : 'var(--acc2)', fontWeight: 700, fontSize: 11 }}>
                        {f.label}{f.required ? ' *' : ''}
                      </span>
                      <span style={{ color: 'var(--txt3)', fontSize: 10, fontFamily: 'monospace' }}>{f.keys[0]}</span>
                    </div>
                  ))}
                  {uploadFields.customFields.length > 0 && (
                    <>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--acc2)', marginTop: 8, marginBottom: 2, letterSpacing: 1 }}>✦ CUSTOM COLUMNS</div>
                      {uploadFields.customFields.map((c: any) => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(79,125,255,0.04)', padding: '9px 14px', borderRadius: 8, border: '1px solid rgba(79,125,255,0.12)' }}>
                          <span style={{ fontFamily: 'monospace', color: 'var(--acc2)', fontWeight: 700, fontSize: 11 }}>{c.label}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadTab;
