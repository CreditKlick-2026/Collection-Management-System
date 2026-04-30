"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';

interface AppContextType {
  user: any;
  setUser: (u: any) => void;
  toast: (msg: string) => void;
  modalOpen: boolean;
  modalTitle: string;
  modalBody: React.ReactNode;
  openModal: (title: string, body: React.ReactNode) => void;
  closeModal: () => void;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalBody, setModalBody] = useState<React.ReactNode>(null);

  const toast = useCallback((msg: string) => {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout((window as any)._tt);
    (window as any)._tt = setTimeout(() => t!.classList.remove('show'), 2800);
  }, []);

  const openModal = useCallback((title: string, body: React.ReactNode) => {
    setModalTitle(title);
    setModalBody(body);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalBody(null);
  }, []);

  return (
    <AppContext.Provider value={{ user, setUser, toast, modalOpen, modalTitle, modalBody, openModal, closeModal }}>
      {children}
      {/* Global Modal */}
      <div className={`modal-bg ${modalOpen ? 'on' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className="modal">
          <div className="m-hdr">
            <div className="m-title">{modalTitle}</div>
            <button className="m-close" onClick={closeModal}>✕</button>
          </div>
          <div>{modalBody}</div>
        </div>
      </div>
      {/* Toast */}
      <div id="toast"></div>
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
