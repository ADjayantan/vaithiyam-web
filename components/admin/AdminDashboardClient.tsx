'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faClipboardCheck, faCubes, faHourglassHalf, faIndianRupeeSign, faMagnifyingGlass, faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminShell } from '@/components/admin/AdminShell';
import type { MedicineCategory, SeedMedicine } from '@/lib/medicineData';

interface AdminOverview {
  stats: {
    totalMedicines: number;
    ordersToday: number;
    pendingPrescriptions: number;
    lowStock: number;
    revenue: number;
  };
  medicines: SeedMedicine[];
  categories: MedicineCategory[];
  orders: Array<{ id: string; status: string; total: number; paymentMethod: string; prescriptionStatus?: string; createdAt: string }>;
  prescriptions: Array<{ id: string; fileName: string; status: string; createdAt: string }>;
  users: Array<{ id: string; name: string; email: string; mobile: string; role: string; createdAt: string }>;
}

function getToken(): string | null {
  try {
    return localStorage.getItem('vt_token') ?? sessionStorage.getItem('vt_token');
  } catch {
    return null;
  }
}

type AdminView = 'dashboard' | 'medicines' | 'categories' | 'orders' | 'prescriptions' | 'users' | 'reports' | 'settings';

export function AdminDashboardClient({ view }: { view: AdminView }) {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(() => {
    const token = getToken();
    if (!token) return;
    fetch('/api/admin/overview', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then((res) => res.ok ? res.json() : null)
      .then((payload: AdminOverview | null) => setData(payload))
      .catch(() => setData(null));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredMedicines = useMemo(() => {
    const q = query.trim().toLowerCase();
    const medicines = data?.medicines ?? [];
    if (!q) return medicines;
    return medicines.filter((item) =>
      item.nameEn.toLowerCase().includes(q) ||
      item.nameTa.includes(q) ||
      item.slug.includes(q) ||
      item.categoryNameEn.toLowerCase().includes(q)
    );
  }, [data?.medicines, query]);

  return (
    <AdminGuard>
      <AdminShell title={titleFor(view)}>
        {!data ? (
          <div className="vt-admin-card" style={{ padding: 24 }}>Loading admin data...</div>
        ) : (
          <div style={{ display: 'grid', gap: 18 }}>
            {view === 'dashboard' && (
              <>
                <Stats stats={data.stats} />
                <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                  <AdminPanel title="Order status summary">
                    <div style={{ display: 'grid', gap: 10 }}>
                      {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                        <SummaryBar key={status} label={status} value={data.orders.filter((order) => order.status === status).length} total={Math.max(1, data.orders.length)} />
                      ))}
                    </div>
                  </AdminPanel>
                  <AdminPanel title="Prescription queue">
                    <AdminTable headers={['File', 'Status', 'Created']} rows={data.prescriptions.map((item) => [item.fileName, item.status, new Date(item.createdAt).toLocaleDateString()])} />
                  </AdminPanel>
                </div>
              </>
            )}

            {view === 'medicines' && (
              <AdminPanel title="Medicine CRUD">
                <AdminToolbar query={query} setQuery={setQuery} actionLabel="Add medicine" />
                <AdminTable
                  headers={['Medicine', 'Category', 'Price', 'Stock', 'Rx', 'Actions']}
                  rows={filteredMedicines.map((item) => [
                    `${item.nameTa} / ${item.nameEn}`,
                    item.categoryNameEn,
                    `₹${item.price} / MRP ₹${item.mrp}`,
                    `${item.stockCount}`,
                    item.prescriptionRequired ? 'Required' : 'No',
                    'Edit · Delete',
                  ])}
                />
              </AdminPanel>
            )}

            {view === 'categories' && (
              <AdminPanel title="Category CRUD">
                <AdminToolbar query={query} setQuery={setQuery} actionLabel="Add category" />
                <AdminTable headers={['Tamil', 'English', 'Slug', 'Icon', 'Actions']} rows={data.categories.map((item) => [item.nameTa, item.nameEn, item.slug, item.icon, 'Edit · Delete'])} />
              </AdminPanel>
            )}

            {view === 'orders' && (
              <AdminPanel title="Order management">
                <AdminTable headers={['Order', 'Status', 'Payment', 'Rx', 'Total', 'Actions']} rows={data.orders.map((item) => [item.id, item.status, item.paymentMethod, item.prescriptionStatus ?? 'not_required', `₹${item.total}`, 'Update status'])} />
              </AdminPanel>
            )}

            {view === 'prescriptions' && (
              <AdminPanel title="Prescription review">
                <AdminTable headers={['File', 'Status', 'Created', 'Actions']} rows={data.prescriptions.map((item) => [item.fileName, item.status, new Date(item.createdAt).toLocaleString(), 'Approve · Reject · Notes'])} />
              </AdminPanel>
            )}

            {view === 'users' && (
              <AdminPanel title="User list">
                <AdminTable headers={['Name', 'Email', 'Mobile', 'Role', 'Created']} rows={data.users.map((item) => [item.name, item.email, item.mobile, item.role, new Date(item.createdAt).toLocaleDateString()])} />
              </AdminPanel>
            )}

            {view === 'reports' && (
              <AdminPanel title="Export-ready reports">
                <AdminTable headers={['Metric', 'Value', 'Notes']} rows={[
                  ['Total medicines', String(data.stats.totalMedicines), 'Inventory report ready'],
                  ['Revenue', `₹${data.stats.revenue}`, 'Mock order totals'],
                  ['Low stock', String(data.stats.lowStock), 'Restock review'],
                  ['Pending prescriptions', String(data.stats.pendingPrescriptions), 'Pharmacist queue'],
                ]} />
              </AdminPanel>
            )}

            {view === 'settings' && (
              <AdminPanel title="Settings">
                <div style={{ display: 'grid', gap: 12, color: 'rgba(236,255,248,0.74)' }}>
                  <p>Admin account setup: demo admin email is <strong>admin@vaithiyam.local</strong>, password <strong>admin1234</strong>.</p>
                  <p>Supabase and Razorpay keys are read from environment variables documented in `.env.local.example`.</p>
                  <p>Prescription approval/rejection buttons are scaffolded for the admin workflow and ready for Supabase mutations.</p>
                </div>
              </AdminPanel>
            )}
          </div>
        )}
      </AdminShell>
    </AdminGuard>
  );
}

function titleFor(view: AdminView) {
  return view.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
}

function Stats({ stats }: { stats: AdminOverview['stats'] }) {
  const cards = [
    { label: 'Total medicines', value: stats.totalMedicines, icon: faCubes },
    { label: 'Orders today', value: stats.ordersToday, icon: faClipboardCheck },
    { label: 'Pending prescriptions', value: stats.pendingPrescriptions, icon: faHourglassHalf },
    { label: 'Low stock', value: stats.lowStock, icon: faBox },
    { label: 'Revenue', value: `₹${stats.revenue}`, icon: faIndianRupeeSign },
  ];
  return (
    <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
      {cards.map((item) => {
        return (
          <div key={item.label} className="vt-admin-card" style={{ padding: 18 }}>
            <FontAwesomeIcon icon={item.icon} style={{ width: 22, height: 22, color: 'var(--vt-gold-300)' }} />
            <strong style={{ display: 'block', marginTop: 14, fontSize: '1.6rem' }}>{item.value}</strong>
            <span style={{ color: 'rgba(236,255,248,0.56)' }}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function AdminPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="vt-admin-card" style={{ padding: 18 }}>
      <h2 style={{ margin: '0 0 14px', fontFamily: 'var(--vt-font-display)' }}>{title}</h2>
      {children}
    </section>
  );
}

function AdminToolbar({ query, setQuery, actionLabel }: { query: string; setQuery: (value: string) => void; actionLabel: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
      <div style={{ position: 'relative', flex: '1 1 280px' }}>
        <FontAwesomeIcon icon={faMagnifyingGlass} style={{width: 17, height: 17, ...{ position: 'absolute', top: 14, left: 12, color: 'rgba(236,255,248,0.46)' }}} />
        <input className="vt-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search table" style={{ paddingLeft: 40, background: 'rgba(255,255,255,0.08)', color: '#fff', borderColor: 'rgba(255,255,255,0.12)' }} />
      </div>
      <button className="vt-button vt-button-gold" type="button"><FontAwesomeIcon icon={faPlus} style={{width: 17, height: 17}} /> {actionLabel}</button>
      <button className="vt-button vt-button-danger" type="button"><FontAwesomeIcon icon={faTrashCan} style={{width: 17, height: 17}} /> Bulk delete</button>
    </div>
  );
}

function AdminTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="vt-table-wrap">
      <table className="vt-table">
        <thead>
          <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length}>No rows found.</td></tr>
          ) : rows.map((row, rowIndex) => (
            <tr key={`${row.join('-')}-${rowIndex}`}>
              {row.map((cell, index) => <td key={`${cell}-${index}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryBar({ label, value, total }: { label: string; value: number; total: number }) {
  const width = Math.round((value / total) * 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, color: 'rgba(236,255,248,0.72)' }}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${width}%`, height: '100%', background: 'linear-gradient(135deg, var(--vt-emerald-600), var(--vt-teal-500))' }} />
      </div>
    </div>
  );
}
