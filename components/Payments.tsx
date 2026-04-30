"use client";
import React, { useState, useEffect } from 'react';

const Payments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    const res = await fetch('/api/payments');
    setPayments(await res.json());
    setLoading(false);
  };

  return (
    <div id="pg-payments" className="page on">
      <div className="ph">
        <div><div className="ph-t">◈ Payments</div><div className="ph-s">Manager-approved cleared payments only</div></div>
        <div className="ph-ml"><button className="btn sm pr">+ Record Payment</button></div>
      </div>
      
      <div className="page-body">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Account #</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
              ) : payments.map(p => (
                <tr key={p.id}>
                  <td className="mn">{p.date}</td>
                  <td className="nm">{p.customer?.name}</td>
                  <td className="mn">{p.customer?.account_no}</td>
                  <td className="mn" style={{ color: 'var(--grn)', fontWeight: 700 }}>₹{p.amount.toLocaleString()}</td>
                  <td>{p.mode}</td>
                  <td><span className="pill ac">cleared</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payments;
