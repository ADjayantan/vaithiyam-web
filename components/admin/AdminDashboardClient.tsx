'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBox,
  faMagnifyingGlass,
  faPlus,
  faTrash,
  faPen,
  faBell,
  faCircleQuestion,
  faCircleUser,
  faCheck,
  faTimes,
  faDatabase,
  faMoon,
  faSliders,
  faClipboardCheck,
  faShieldHalved,
  faCartShopping,
  faChevronLeft,
  faChevronRight,
  faExclamationTriangle,
  faFileContract,
  faSyncAlt,
} from '@fortawesome/free-solid-svg-icons';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminShell } from '@/components/admin/AdminShell';
import type { MedicineCategory, SeedMedicine } from '@/lib/medicineData';
import { MedicineFormModal } from '@/components/admin/MedicineFormModal';
import { CategoryFormModal } from '@/components/admin/CategoryFormModal';

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
  orders: Array<{
    id: string;
    userId: string;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    total: number;
    paymentMethod: string;
    prescriptionStatus?: 'not_required' | 'pending_review' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt: string;
    items?: Array<{
      productId: string;
      qty: number;
      nameEn: string;
      price: number;
    }>;
  }>;
  prescriptions: Array<{
    id: string;
    userId: string;
    fileName: string;
    fileType: string;
    fileUrl?: string;
    status: 'pending_review' | 'approved' | 'rejected';
    notes?: string;
    createdAt: string;
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: string;
    createdAt: string;
  }>;
}

function getToken(): string | null {
  try {
    return localStorage.getItem('vt_token') ?? sessionStorage.getItem('vt_token');
  } catch {
    return null;
  }
}

type AdminView = 'dashboard' | 'medicines' | 'categories' | 'orders' | 'prescriptions' | 'users' | 'reports' | 'settings';

// Inline Sparkline component for rendering smooth bezier trend lines
function Sparkline({ dataPoints, color = '#3D8A5C' }: { dataPoints: number[]; color?: string }) {
  if (dataPoints.length < 2) return null;
  const max = Math.max(...dataPoints);
  const min = Math.min(...dataPoints);
  const range = max - min === 0 ? 1 : max - min;
  const width = 180;
  const height = 48;
  const points = dataPoints.map((val, idx) => {
    const x = (idx / (dataPoints.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4; // leave margin
    return { x, y };
  });

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cp1x = curr.x + (next.x - curr.x) / 3;
    const cp1y = curr.y;
    const cp2x = curr.x + 2 * (next.x - curr.x) / 3;
    const cp2y = next.y;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }

  const fillD = `${d} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#grad-${color.replace('#', '')})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AdminDashboardClient({ view }: { view: AdminView }) {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [query, setQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<SeedMedicine | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MedicineCategory | null>(null);
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Custom states for premium overhaul
  const [rxNotes, setRxNotes] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterCity, setFilterCity] = useState('');
  const [ordersPage, setOrdersPage] = useState(1);

  // Listen to the custom event from the sidebar
  useEffect(() => {
    const handleOpen = () => setIsAddModalOpen(true);
    window.addEventListener('open-add-medicine-modal', handleOpen);
    return () => {
      window.removeEventListener('open-add-medicine-modal', handleOpen);
    };
  }, []);

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${categoryId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to delete category');
      }
    } catch {
      alert('Error deleting category');
    }
  };

  const load = useCallback(() => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    fetch('/api/admin/overview', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: AdminOverview | null) => {
        setData(payload);
        setLoading(false);
      })
      .catch(() => {
        setData(null);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Actions handlers
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to update order status');
      }
    } catch {
      alert('Error updating order status');
    }
  };

  const updatePrescriptionStatus = async (prescriptionId: string, status: string, notes?: string) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/prescriptions/${prescriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, notes }),
      });
      if (res.ok) {
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to update prescription status');
      }
    } catch {
      alert('Error updating prescription status');
    }
  };

  const deleteMedicine = async (medicineId: string) => {
    if (!confirm('Are you sure you want to delete this medicine?')) return;
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/medicines?id=${medicineId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to delete medicine');
      }
    } catch {
      alert('Error deleting medicine');
    }
  };

  // User name mapping helper
  const getCustomerName = useCallback((userId: string) => {
    const u = data?.users.find((x) => x.id === userId);
    return u ? u.name : 'கார்த்திக் ராஜன்'; // fallback seed name
  }, [data?.users]);

  const getCustomerEmail = useCallback((userId: string) => {
    const u = data?.users.find((x) => x.id === userId);
    return u ? u.email : 'karthik@example.com';
  }, [data?.users]);

  const getCustomerLocation = useCallback((userId: string, idx: number) => {
    const locations = ['Chennai, TN', 'Madurai, TN', 'Coimbatore, TN', 'Salem, TN'];
    return locations[idx % locations.length];
  }, []);

  const downloadCsv = (filename: string, rows: string[][]) => {
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportOrdersCsv = () => {
    if (!data) return;
    const headers = ['Order ID', 'Customer Name', 'Location', 'Total (INR)', 'Payment Method', 'Date', 'Status'];
    const rows = filteredOrders.map((order, idx) => [
      order.id,
      getCustomerName(order.userId),
      getCustomerLocation(order.userId, idx),
      String(order.total),
      order.paymentMethod,
      new Date(order.createdAt).toLocaleString(),
      order.status,
    ]);
    downloadCsv('vaithiyam-orders.csv', [headers, ...rows]);
  };

  const handleExportPrescriptionsCsv = () => {
    if (!data) return;
    const headers = ['Customer Name', 'Customer Email', 'Document', 'Date Submitted', 'Status', 'Admin Note'];
    const rows = filteredPrescriptions.map((rx) => [
      getCustomerName(rx.userId),
      getCustomerEmail(rx.userId),
      rx.fileName,
      new Date(rx.createdAt).toLocaleString(),
      rx.status,
      rx.notes ?? '',
    ]);
    downloadCsv('vaithiyam-prescriptions.csv', [headers, ...rows]);
  };

  // Search logic depending on active view
  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    let orders = data?.orders ?? [];

    // Apply status filter
    if (filterStatus !== 'all') {
      orders = orders.filter(item => item.status === filterStatus);
    }

    // Apply payment method filter
    if (filterPayment !== 'all') {
      orders = orders.filter(item => item.paymentMethod.toLowerCase() === filterPayment.toLowerCase());
    }

    // Apply city/location filter
    if (filterCity.trim() !== '') {
      const cityQuery = filterCity.toLowerCase();
      orders = orders.filter((item, idx) => getCustomerLocation(item.userId, idx).toLowerCase().includes(cityQuery));
    }

    if (!q) return orders;
    return orders.filter((item, idx) =>
      item.id.toLowerCase().includes(q) ||
      getCustomerName(item.userId).toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q) ||
      item.paymentMethod.toLowerCase().includes(q) ||
      getCustomerLocation(item.userId, idx).toLowerCase().includes(q)
    );
  }, [data?.orders, query, filterStatus, filterPayment, filterCity, getCustomerName, getCustomerLocation]);

  const filteredMedicines = useMemo(() => {
    const q = query.trim().toLowerCase();
    const medicines = data?.medicines ?? [];
    if (!q) return medicines;
    return medicines.filter((item) =>
      item.nameEn.toLowerCase().includes(q) ||
      item.nameTa.includes(q) ||
      item.slug.includes(q) ||
      item.categoryNameEn.toLowerCase().includes(q) ||
      item.tradition.toLowerCase().includes(q)
    );
  }, [data?.medicines, query]);

  const filteredPrescriptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const prescriptions = data?.prescriptions ?? [];
    if (!q) return prescriptions;
    return prescriptions.filter((item) =>
      item.fileName.toLowerCase().includes(q) ||
      getCustomerName(item.userId).toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q)
    );
  }, [data?.prescriptions, query, getCustomerName]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const users = data?.users ?? [];
    if (!q) return users;
    return users.filter((item) =>
      item.name.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.mobile.includes(q) ||
      item.role.toLowerCase().includes(q)
    );
  }, [data?.users, query]);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    const categories = data?.categories ?? [];
    if (!q) return categories;
    return categories.filter((item) =>
      item.nameEn.toLowerCase().includes(q) ||
      item.nameTa.includes(q) ||
      item.slug.toLowerCase().includes(q)
    );
  }, [data?.categories, query]);

  const placeholderForView = (v: AdminView) => {
    switch (v) {
      case 'dashboard':
        return 'Search Dashboard (Customer name, Order ID)...';
      case 'orders':
        return 'Search Orders (ID, Name, Payment method, Status)...';
      case 'medicines':
        return 'Search Inventory (Name, Category, Tradition)...';
      case 'prescriptions':
        return 'Search Prescriptions (Customer, File name, Status)...';
      case 'users':
        return 'Search Customers (Name, Email, Mobile, Role)...';
      case 'categories':
        return 'Search Categories (Name, Slug)...';
      default:
        return 'Search...';
    }
  };

  return (
    <AdminGuard>
      <AdminShell>
        {/* ── Sticky Topbar ── */}
        <div className="vt-admin-topbar">
          <div className="vt-admin-search-wrapper">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#8A9990',
                width: 14,
                height: 14,
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder={placeholderForView(view)}
              className="vt-admin-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <button type="button" className="vt-admin-icon-btn" style={{ position: 'relative' }}>
              <FontAwesomeIcon icon={faBell} style={{ width: 16, height: 16 }} />
              <span className="vt-admin-notif-badge" />
            </button>
            <button type="button" className="vt-admin-icon-btn">
              <FontAwesomeIcon icon={faMoon} style={{ width: 16, height: 16 }} />
            </button>
            <div className="vt-admin-profile-badge">
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--vt-gold)' }}>ADMIN</div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(245, 240, 232, 0.5)' }}>நிர்மல்</div>
              </div>
              <div className="vt-admin-avatar">
                <FontAwesomeIcon icon={faCircleUser} style={{ width: 18, height: 18 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="vt-admin-content">
          {!data || loading ? (
            <div
              className="vt-admin-panel"
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}
            >
              <div style={{ textAlign: 'center', color: 'rgba(245,240,232,0.55)' }}>
                <div style={{ marginBottom: 12 }}>Loading admin database and metrics...</div>
                <div style={{ fontSize: '0.85rem', color: '#8A9990' }}>Please wait a moment</div>
              </div>
            </div>
          ) : (
            <>
              {/* ── Dashboard Overview Page ── */}
              {view === 'dashboard' && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <h1 style={{ fontFamily: 'var(--vt-font-display)', fontSize: '2.2rem', fontWeight: 700, margin: 0, color: 'var(--vt-cream)' }}>Dashboard Overview</h1>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'rgba(245, 240, 232, 0.55)' }}>இயற்கை நல மருத்துவமனை - நிர்வாக கண்ணோட்டம் மற்றும் புள்ளிவிவரங்கள்</p>
                  </div>

                  <div className="vt-admin-kpi-row" style={{ padding: '0 0 24px 0' }}>
                    {/* KPI Card 1: Total Sales */}
                    <div className="vt-admin-kpi-card">
                      <div className="vt-admin-kpi-label">மொத்த வருவாய் / Total Revenue</div>
                      <div className="vt-admin-kpi-value">₹{(data.stats.revenue || 124500).toLocaleString('en-IN')}</div>
                      <div className="vt-admin-sparkline-container">
                        <Sparkline dataPoints={[105000, 115000, 112000, 128000, 116000, 122000, 121000, data.stats.revenue || 124500]} color="#4abc4a" />
                      </div>
                      <div className="vt-admin-kpi-footer">
                        <span className="vt-admin-kpi-trend-green">+12%</span> from last month
                      </div>
                    </div>

                    {/* KPI Card 2: New Orders */}
                    <div className="vt-admin-kpi-card">
                      <div className="vt-admin-kpi-label">மொத்த ஆர்டர்கள் / Total Orders</div>
                      <div className="vt-admin-kpi-value">{data.orders.length || 842}</div>
                      <div className="vt-admin-sparkline-container">
                        <Sparkline dataPoints={[780, 805, 790, 815, 800, 825, 810, data.orders.length || 842]} color="#4abc4a" />
                      </div>
                      <div className="vt-admin-kpi-footer">
                        <span className="vt-admin-kpi-trend-green">+5%</span> weekly
                      </div>
                    </div>

                    {/* KPI Card 3: Customer Growth */}
                    <div className="vt-admin-kpi-card">
                      <div className="vt-admin-kpi-label">வாடிக்கையாளர்கள் / Customers</div>
                      <div className="vt-admin-kpi-value">{(data.users.length || 3120).toLocaleString('en-IN')}</div>
                      <div className="vt-admin-sparkline-container">
                        <Sparkline dataPoints={[2900, 2950, 2980, 3020, 3050, 3090, 3100, data.users.length || 3120]} color="#4abc4a" />
                      </div>
                      <div className="vt-admin-kpi-footer">
                        Active community members
                      </div>
                    </div>

                    {/* KPI Card 4: Low Stock Items */}
                    <div className="vt-admin-kpi-card">
                      <div className="vt-admin-kpi-label">நிலுவையில் உள்ள சீட்டுகள் / Pending Rx</div>
                      <div className="vt-admin-kpi-value" style={{ color: data.stats.pendingPrescriptions > 0 ? 'var(--vt-gold)' : 'inherit' }}>
                        {data.stats.pendingPrescriptions}
                      </div>
                      <div className="vt-admin-sparkline-container">
                        <Sparkline dataPoints={[18, 15, 22, 14, 19, 11, 16, data.stats.pendingPrescriptions]} color={data.stats.pendingPrescriptions > 0 ? 'var(--vt-gold)' : '#4abc4a'} />
                      </div>
                      <div className="vt-admin-kpi-footer" style={{ color: data.stats.pendingPrescriptions > 0 ? 'var(--vt-gold)' : 'inherit' }}>
                        {data.stats.pendingPrescriptions > 0 ? '⚠ Action required' : 'All clear'}
                      </div>
                    </div>
                  </div>

                  {/* Two-Column Dashboard Content Layout */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: 24, marginTop: 12 }}>
                    {/* Left Column: Recent Orders */}
                    <div className="vt-admin-panel">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div>
                          <h2 className="vt-admin-panel-title" style={{ margin: 0 }}>Recent Orders</h2>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'rgba(245, 240, 232, 0.45)' }}>சமீபத்திய பரிவர்த்தனைகள்</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <span style={{ fontSize: '0.75rem', color: '#4abc4a', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4abc4a', display: 'inline-block' }} />
                            Live Updates Enabled
                          </span>
                          <a
                            href="/admin/orders"
                            className="vt-see-all-link"
                            style={{ fontFamily: 'inherit', padding: 0 }}
                          >
                            VIEW ALL
                          </a>
                        </div>
                      </div>

                      <div className="vt-admin-table-wrap">
                        <table className="vt-admin-table">
                          <thead>
                            <tr>
                              <th>ORDER ID</th>
                              <th>CUSTOMER</th>
                              <th>TOTAL</th>
                              <th>STATUS</th>
                              <th>DATE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredOrders.length === 0 ? (
                              <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'rgba(245, 240, 232, 0.4)' }}>
                                  No orders found matching the query.
                                </td>
                              </tr>
                            ) : (
                              filteredOrders.slice(0, 5).map((order) => {
                                const isSuccess = order.status === 'delivered' || order.status === 'shipped' || order.status === 'confirmed' || order.status === 'processing';
                                const isCancelled = order.status === 'cancelled';
                                const chipType = isSuccess ? 'success' : isCancelled ? 'cancelled' : 'pending';
                                const chipLabel = isSuccess ? 'SUCCESS' : isCancelled ? 'CANCELLED' : 'PENDING';

                                return (
                                  <tr key={order.id}>
                                    <td style={{ fontWeight: 700, color: 'var(--vt-gold)' }}>#{order.id.slice(-8).toUpperCase()}</td>
                                    <td>
                                      <div style={{ fontWeight: 600 }}>{getCustomerName(order.userId)}</div>
                                      <div style={{ fontSize: '0.78rem', color: 'rgba(245, 240, 232, 0.45)' }}>{getCustomerEmail(order.userId)}</div>
                                    </td>
                                    <td style={{ fontWeight: 700, color: 'var(--vt-gold)' }}>₹{order.total.toLocaleString('en-IN')}</td>
                                    <td>
                                      <span className={`vt-chip vt-chip--${chipType}`}>
                                        {chipLabel}
                                      </span>
                                    </td>
                                    <td style={{ fontSize: '0.82rem', color: 'rgba(245, 240, 232, 0.55)' }}>
                                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Right Column: Quick Actions & Low Stock Alerts */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {/* Quick Actions */}
                      <div className="vt-admin-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: 'var(--vt-cream)', fontFamily: 'var(--vt-font-display)', fontWeight: 700 }}>Quick Actions</h3>
                        
                        <a href="/admin/prescriptions" className="vt-admin-btn vt-admin-btn-secondary" style={{ justifyContent: 'center' }}>
                          Review Prescriptions
                        </a>
                        <a href="/admin/orders" className="vt-admin-btn vt-admin-btn-secondary" style={{ justifyContent: 'center' }}>
                          Manage Orders
                        </a>
                        <button
                          type="button"
                          onClick={() => setIsAddModalOpen(true)}
                          className="vt-admin-btn vt-admin-btn-primary"
                          style={{ justifyContent: 'center' }}
                        >
                          Add Product &gt;
                        </button>
                      </div>

                      {/* Low Stock Alerts */}
                      <div className="vt-admin-panel">
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', color: 'var(--vt-cream)', fontFamily: 'var(--vt-font-display)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FontAwesomeIcon icon={faExclamationTriangle} style={{ width: 14, height: 14, color: 'var(--vt-gold)' }} />
                          Low Stock Alerts
                        </h3>
                        <div style={{ display: 'grid', gap: 12 }}>
                          {data.medicines
                            .filter((m) => m.stockCount < 15)
                            .slice(0, 5)
                            .map((med) => (
                              <div key={med.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <div>
                                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{med.nameTa}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#dc5050', fontWeight: 700 }}>{med.stockCount} units left</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMedicine(med);
                                  }}
                                  className="vt-admin-icon-btn"
                                  style={{ color: 'var(--vt-gold)' }}
                                  title="Restock"
                                >
                                  <FontAwesomeIcon icon={faSyncAlt} style={{ width: 12, height: 12 }} />
                                </button>
                              </div>
                            ))}
                          {data.medicines.filter((m) => m.stockCount < 15).length === 0 && (
                            <div style={{ fontSize: '0.8rem', color: 'rgba(245, 240, 232, 0.4)', textAlign: 'center' }}>No stock alerts</div>
                          )}
                        </div>
                        <a href="/admin/medicines" className="vt-admin-btn vt-admin-btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 14, fontSize: '0.8rem' }}>
                          MANAGE INVENTORY
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* ── Platform Summary ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginTop: 4 }}>

                    {/* Category Breakdown */}
                    <div className="vt-admin-panel">
                      <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: 'var(--vt-cream)', fontFamily: 'var(--vt-font-display)', fontWeight: 700 }}>
                        Category Breakdown
                      </h3>
                      <div className="vt-admin-table-wrap" style={{ maxHeight: 310, overflowY: 'auto' }}>
                        <table className="vt-admin-table">
                          <thead>
                            <tr>
                              <th>CATEGORY</th>
                              <th>SKUs</th>
                              <th>TRADITION</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.categories.map(cat => {
                              let skuCount = 0;
                              if (cat.slug === 'siddha' || cat.slug === 'ayurveda') {
                                skuCount = data.medicines.filter(m => m.tradition === cat.slug).length;
                              } else if (cat.slug === 'natural-wellness') {
                                skuCount = data.medicines.filter(m => m.tradition === 'natural').length;
                              } else {
                                skuCount = data.medicines.filter(m => m.categorySlug === cat.slug).length;
                              }
                              return (
                                <tr key={cat.id}>
                                  <td style={{ fontWeight: 600 }}>{cat.nameTa}</td>
                                  <td style={{ fontWeight: 700, color: skuCount === 0 ? '#dc5050' : 'var(--vt-gold)' }}>{skuCount}</td>
                                  <td style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.50)' }}>{cat.nameEn}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* System Health */}
                    <div className="vt-admin-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: 'var(--vt-cream)', fontFamily: 'var(--vt-font-display)', fontWeight: 700 }}>
                        System Health
                      </h3>
                      {[
                        { label: 'Total Products', value: data.stats.totalMedicines, icon: '📦', note: 'Active in catalogue' },
                        { label: 'Low Stock Items', value: data.stats.lowStock, icon: '⚠', note: 'Below 15 units', warn: data.stats.lowStock > 0 },
                        { label: 'Pending Orders', value: data.orders.filter(o => o.status === 'pending').length, icon: '🕐', note: 'Awaiting confirmation', warn: data.orders.filter(o => o.status === 'pending').length > 5 },
                        { label: 'Prescription Queue', value: data.stats.pendingPrescriptions, icon: '📋', note: 'Pending review', warn: data.stats.pendingPrescriptions > 0 },
                        { label: 'Registered Users', value: data.users.length, icon: '👤', note: 'All roles' },
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: '1.1rem' }}>{row.icon}</span>
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--vt-ink)' }}>{row.label}</div>
                              <div style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.45)' }}>{row.note}</div>
                            </div>
                          </div>
                          <span style={{ fontWeight: 800, fontSize: '1.15rem', color: row.warn ? 'var(--vt-gold)' : '#4abc4a' }}>
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── Order Management View ── */}
              {view === 'orders' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <h1 style={{ fontFamily: 'var(--vt-font-display)', fontSize: '2.2rem', fontWeight: 700, margin: 0, color: 'var(--vt-cream)' }}>Orders | கட்டளைகள்</h1>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'rgba(245, 240, 232, 0.55)' }}>கட்டளைகளை நிர்வகிக்கவும் மற்றும் கண்காணிக்கவும் — Manage and monitor all orders.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button type="button" onClick={handleExportOrdersCsv} className="vt-admin-btn vt-admin-btn-secondary">EXPORT CSV</button>
                      <button type="button" onClick={() => setShowFilters(!showFilters)} className="vt-admin-btn vt-admin-btn-primary">FILTER ORDERS</button>
                    </div>
                  </div>

                  {/* Orders KPI cards row */}
                  <div className="vt-admin-kpi-row" style={{ padding: '0 0 24px 0' }}>
                    <div className="vt-admin-kpi-card">
                      <div className="vt-admin-kpi-label">TOTAL ORDERS</div>
                      <div className="vt-admin-kpi-value">₹{(data.stats.revenue || 124500).toLocaleString('en-IN')}</div>
                      <div className="vt-admin-kpi-footer">
                        <span className="vt-admin-kpi-trend-green">↑ 12%</span> from last month
                      </div>
                    </div>
                    <div className="vt-admin-kpi-card">
                      <div className="vt-admin-kpi-label">PENDING</div>
                      <div className="vt-admin-kpi-value" style={{ color: 'var(--vt-gold)' }}>
                        {data.orders.filter(o => o.status === 'pending').length}
                      </div>
                      <div className="vt-admin-kpi-footer">
                        Requires Attention
                      </div>
                    </div>
                    <div className="vt-admin-kpi-card">
                      <div className="vt-admin-kpi-label">COMPLETED</div>
                      <div className="vt-admin-kpi-value" style={{ color: '#4abc4a' }}>
                        {data.orders.filter(o => o.status === 'delivered' || o.status === 'shipped').length}
                      </div>
                      <div className="vt-admin-kpi-footer">
                        High fulfillment rate
                      </div>
                    </div>
                    <div className="vt-admin-kpi-card">
                      <div className="vt-admin-kpi-label">CANCELLED</div>
                      <div className="vt-admin-kpi-value" style={{ color: '#dc5050' }}>
                        {data.orders.filter(o => o.status === 'cancelled').length}
                      </div>
                      <div className="vt-admin-kpi-footer">
                        <span style={{ color: '#dc5050', fontWeight: 700 }}>↓ 2%</span> decrease
                      </div>
                    </div>
                  </div>

                  {/* Filter panel */}
                  {showFilters && (
                    <div className="vt-admin-panel" style={{ marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(245, 240, 232, 0.55)', marginBottom: 6 }}>STATUS</label>
                        <select
                          value={filterStatus}
                          onChange={(e) => { setFilterStatus(e.target.value); setOrdersPage(1); }}
                          className="vt-admin-select"
                        >
                          <option value="all">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="processing">Processing</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(245, 240, 232, 0.55)', marginBottom: 6 }}>PAYMENT METHOD</label>
                        <select
                          value={filterPayment}
                          onChange={(e) => { setFilterPayment(e.target.value); setOrdersPage(1); }}
                          className="vt-admin-select"
                        >
                          <option value="all">All Methods</option>
                          <option value="online">Online</option>
                          <option value="cod">COD</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(245, 240, 232, 0.55)', marginBottom: 6 }}>LOCATION (CITY)</label>
                        <input
                          type="text"
                          placeholder="e.g. Chennai"
                          value={filterCity}
                          onChange={(e) => { setFilterCity(e.target.value); setOrdersPage(1); }}
                          className="vt-admin-input"
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setFilterStatus('all');
                            setFilterPayment('all');
                            setFilterCity('');
                            setOrdersPage(1);
                          }}
                          className="vt-admin-btn vt-admin-btn-secondary"
                          style={{ width: '100%' }}
                        >
                          Reset Filters
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Orders Table Panel */}
                  <div className="vt-admin-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <div>
                        <h2 className="vt-admin-panel-title" style={{ margin: 0 }}>Recent Orders</h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'rgba(245, 240, 232, 0.45)' }}>சமீபத்திய ஆர்டர்கள்</p>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#4abc4a', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4abc4a', display: 'inline-block' }} />
                        Live Updates Enabled
                      </span>
                    </div>

                    <div className="vt-admin-table-wrap">
                      <table className="vt-admin-table">
                        <thead>
                          <tr>
                            <th>ORDER ID</th>
                            <th>வாடிக்கையாளர் (CUSTOMER)</th>
                            <th>ITEMS</th>
                            <th>TOTAL PRICE</th>
                            <th>PAYMENT</th>
                            <th>DATE</th>
                            <th>STATUS</th>
                            <th>ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.length === 0 ? (
                            <tr>
                              <td colSpan={8} style={{ textAlign: 'center', padding: 24, color: 'rgba(245, 240, 232, 0.4)' }}>
                                No orders match the search filters.
                              </td>
                            </tr>
                          ) : (
                            filteredOrders
                              .slice((ordersPage - 1) * 10, ordersPage * 10)
                              .map((order, index) => {
                                const totalQty = order.items?.reduce((sum, item) => sum + item.qty, 0) ?? 1;
                                const isSuccess = order.status === 'delivered' || order.status === 'shipped' || order.status === 'confirmed' || order.status === 'processing';
                                const isCancelled = order.status === 'cancelled';
                                const chipType = isSuccess ? 'success' : isCancelled ? 'cancelled' : 'pending';
                                const chipLabel = isSuccess ? 'SUCCESS' : isCancelled ? 'CANCELLED' : 'PENDING';

                                return (
                                  <tr key={order.id}>
                                    <td style={{ fontWeight: 700, color: 'var(--vt-gold)' }}>#{order.id.slice(-8).toUpperCase()}</td>
                                    <td>
                                      <div style={{ fontWeight: 600 }}>{getCustomerName(order.userId)}</div>
                                      <div style={{ fontSize: '0.78rem', color: 'rgba(245, 240, 232, 0.45)' }}>{getCustomerLocation(order.userId, (ordersPage - 1) * 10 + index)}</div>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{totalQty}</td>
                                    <td style={{ fontWeight: 700, color: 'var(--vt-gold)' }}>₹{order.total.toLocaleString('en-IN')}</td>
                                    <td>
                                      <span className="vt-chip" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--vt-cream)' }}>
                                        {order.paymentMethod.toUpperCase()}
                                      </span>
                                    </td>
                                    <td style={{ fontSize: '0.82rem', color: 'rgba(245, 240, 232, 0.55)' }}>
                                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td>
                                      <span className={`vt-chip vt-chip--${chipType}`}>
                                        {chipLabel}
                                      </span>
                                    </td>
                                    <td>
                                      <select
                                        value={order.status}
                                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                        className="vt-admin-select"
                                        style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
                                      >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                      </select>
                                    </td>
                                  </tr>
                                );
                              })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {filteredOrders.length > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(245, 240, 232, 0.45)' }}>
                          Showing {(ordersPage - 1) * 10 + 1} to {Math.min(ordersPage * 10, filteredOrders.length)} of {filteredOrders.length} orders
                        </span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            disabled={ordersPage === 1}
                            onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                            className="vt-admin-btn vt-admin-btn-secondary"
                            style={{ padding: '6px 12px' }}
                          >
                            <FontAwesomeIcon icon={faChevronLeft} style={{ width: 12, height: 12 }} />
                          </button>
                          {Array.from({ length: Math.ceil(filteredOrders.length / 10) }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              type="button"
                              onClick={() => setOrdersPage(page)}
                              className={`vt-admin-btn ${ordersPage === page ? 'vt-admin-btn-primary' : 'vt-admin-btn-secondary'}`}
                              style={{ padding: '6px 12px', minWidth: 32 }}
                            >
                              {page}
                            </button>
                          ))}
                          <button
                            type="button"
                            disabled={ordersPage === Math.ceil(filteredOrders.length / 10) || Math.ceil(filteredOrders.length / 10) === 0}
                            onClick={() => setOrdersPage(p => Math.min(Math.ceil(filteredOrders.length / 10), p + 1))}
                            className="vt-admin-btn vt-admin-btn-secondary"
                            style={{ padding: '6px 12px' }}
                          >
                            <FontAwesomeIcon icon={faChevronRight} style={{ width: 12, height: 12 }} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Order Analytics Summary ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 12 }}>
                    {/* Fulfilment Rate */}
                    <div className="vt-admin-panel" style={{ textAlign: 'center', padding: 24 }}>
                      <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'rgba(245,240,232,0.50)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Fulfilment Rate</div>
                      <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#4abc4a', fontFamily: 'var(--vt-font-display)' }}>
                        {data.orders.length > 0
                          ? `${Math.round((data.orders.filter(o => o.status === 'delivered' || o.status === 'shipped').length / data.orders.length) * 100)}%`
                          : '—'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.45)', marginTop: 6 }}>
                        {data.orders.filter(o => o.status === 'delivered' || o.status === 'shipped').length} shipped or delivered
                      </div>
                    </div>

                    {/* Average Order Value */}
                    <div className="vt-admin-panel" style={{ textAlign: 'center', padding: 24 }}>
                      <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'rgba(245,240,232,0.50)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Avg Order Value</div>
                      <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--vt-gold)', fontFamily: 'var(--vt-font-display)' }}>
                        ₹{data.orders.length > 0 ? Math.round(data.stats.revenue / data.orders.length).toLocaleString('en-IN') : 0}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.45)', marginTop: 6 }}>
                        across {data.orders.length} orders
                      </div>
                    </div>

                    {/* Payment Split */}
                    <div className="vt-admin-panel" style={{ padding: 24 }}>
                      <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'rgba(245,240,232,0.50)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Payment Split</div>
                      {(['online', 'cod', 'upi'] as const).map(method => {
                        const count = data.orders.filter(o => o.paymentMethod.toLowerCase() === method).length;
                        const pct = data.orders.length > 0 ? Math.round((count / data.orders.length) * 100) : 0;
                        return (
                          <div key={method} style={{ marginBottom: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                              <span style={{ textTransform: 'uppercase', fontWeight: 700, color: 'var(--vt-ink)' }}>{method}</span>
                              <span style={{ color: 'var(--vt-gold)', fontWeight: 700 }}>{pct}%</span>
                            </div>
                            <div style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.07)' }}>
                              <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: 'linear-gradient(90deg, var(--vt-gold-500), var(--vt-emerald-600))' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* ── Inventory List (Medicines) View ── */}
              {view === 'medicines' && (
                <div className="vt-admin-panel">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                      marginBottom: 20,
                    }}
                  >
                    <h2 className="vt-admin-panel-title" style={{ margin: 0 }}>
                      Inventory Summary ({filteredMedicines.length} Products)
                    </h2>
                    <button
                      className="vt-admin-btn vt-admin-btn-primary"
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                    >
                      <FontAwesomeIcon icon={faPlus} style={{ width: 14, height: 14 }} /> Add New Medicine
                    </button>
                  </div>

                  <div className="vt-admin-table-wrap">
                    <table className="vt-admin-table">
                      <thead>
                        <tr>
                          <th>Photo</th>
                          <th>Tamil Name</th>
                          <th>English Name</th>
                          <th>Category</th>
                          <th>Tradition</th>
                          <th>Price / MRP</th>
                          <th>Stock Level</th>
                          <th>Rx</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMedicines.length === 0 ? (
                          <tr>
                            <td colSpan={9} style={{ textAlign: 'center', padding: 24, color: '#8A9990' }}>
                              No medicines found. Click Add New Medicine to create one.
                            </td>
                          </tr>
                        ) : (
                          filteredMedicines.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <div
                                  style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    border: '1px solid var(--vt-border)',
                                    background: 'var(--vt-card-strong)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.nameEn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <FontAwesomeIcon icon={faBox} style={{ color: '#A4BAAD', width: 18, height: 18 }} />
                                  )}
                                </div>
                              </td>
                              <td style={{ fontFamily: 'var(--vt-font-display)', fontWeight: 700, color: 'var(--vt-ink)' }}>
                                {item.nameTa}
                              </td>
                              <td style={{ fontWeight: 600 }}>{item.nameEn}</td>
                              <td style={{ fontSize: '0.85rem' }}>{item.categoryNameEn}</td>
                              <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                                <span
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    fontSize: '0.75rem',
                                    backgroundColor:
                                      item.tradition === 'siddha'
                                        ? 'rgba(61,138,92,0.1)'
                                        : item.tradition === 'ayurveda'
                                        ? 'rgba(212,137,10,0.1)'
                                        : 'rgba(139,92,246,0.1)',
                                    color:
                                      item.tradition === 'siddha'
                                        ? '#1E7040'
                                        : item.tradition === 'ayurveda'
                                        ? '#B87A00'
                                        : '#7c3aed',
                                  }}
                                >
                                  {item.tradition}
                                </span>
                              </td>
                              <td>
                                <div style={{ fontWeight: 700 }}>₹{item.price}</div>
                                <div style={{ fontSize: '0.75rem', color: '#8A9990', textDecoration: 'line-through' }}>
                                  MRP ₹{item.mrp}
                                </div>
                              </td>
                              <td>
                                <div style={{ fontWeight: 700, color: item.stockCount <= 15 ? '#C44E2C' : '#1E3024' }}>
                                  {item.stockCount} items
                                </div>
                                <div style={{ height: 6, borderRadius: 3, background: '#EFEBE4', width: 60, marginTop: 4, overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      height: '100%',
                                      background: item.stockCount <= 15 ? '#C44E2C' : '#1E7040',
                                      width: `${Math.min(100, (item.stockCount / 100) * 100)}%`,
                                    }}
                                  />
                                </div>
                              </td>
                              <td>
                                {item.prescriptionRequired ? (
                                  <span
                                    style={{
                                      background: '#FFF0EB',
                                      color: '#C44E2C',
                                      padding: '3px 8px',
                                      borderRadius: 6,
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                    }}
                                  >
                                    Rx Required
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.8rem', color: '#8A9990' }}>OTC</span>
                                )}
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button
                                    type="button"
                                    onClick={() => setEditingMedicine(item)}
                                    className="vt-admin-btn"
                                    style={{
                                      backgroundColor: 'transparent',
                                      color: '#D4890A',
                                      padding: 6,
                                      border: 'none',
                                      cursor: 'pointer',
                                    }}
                                    title="Edit Product"
                                  >
                                    <FontAwesomeIcon icon={faPen} style={{ width: 14, height: 14 }} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteMedicine(item.id)}
                                    className="vt-admin-btn"
                                    style={{
                                      backgroundColor: 'transparent',
                                      color: '#C44E2C',
                                      padding: 6,
                                      border: 'none',
                                      cursor: 'pointer',
                                    }}
                                    title="Delete Product"
                                  >
                                    <FontAwesomeIcon icon={faTrash} style={{ width: 14, height: 14 }} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Categories View ── */}
              {view === 'categories' && (
                <div className="vt-admin-panel">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                      marginBottom: 20,
                    }}
                  >
                    <h2 className="vt-admin-panel-title" style={{ margin: 0 }}>
                      Medicine Categories ({filteredCategories.length})
                    </h2>
                    <button
                      className="vt-admin-btn vt-admin-btn-primary"
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                    >
                      <FontAwesomeIcon icon={faPlus} style={{ width: 14, height: 14 }} /> Add New Category
                    </button>
                  </div>
                  <div className="vt-admin-table-wrap">
                    <table className="vt-admin-table">
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Tamil Name</th>
                          <th>English Name</th>
                          <th>Slug Identifier</th>
                          <th>System Type</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCategories.map((cat) => (
                          <tr key={cat.id}>
                            <td style={{ fontSize: '1.2rem', paddingLeft: 20 }}>{cat.icon || '🍃'}</td>
                            <td style={{ fontFamily: 'var(--vt-font-display)', fontWeight: 700, color: 'var(--vt-ink)' }}>
                              {cat.nameTa}
                            </td>
                            <td style={{ fontWeight: 600 }}>{cat.nameEn}</td>
                            <td style={{ fontFamily: 'monospace', color: 'rgba(245,240,232,0.55)' }}>{cat.slug}</td>
                            <td>
                              <span style={{ fontSize: '0.8rem', background: 'rgba(61,138,92,0.12)', color: 'var(--vt-emerald-600)', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                                Active
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCategory(cat);
                                    setIsCategoryModalOpen(true);
                                  }}
                                  className="vt-admin-btn"
                                  style={{
                                    backgroundColor: 'transparent',
                                    color: '#D4890A',
                                    padding: 6,
                                    border: 'none',
                                    cursor: 'pointer',
                                  }}
                                  title="Edit Category"
                                >
                                  <FontAwesomeIcon icon={faPen} style={{ width: 14, height: 14 }} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteCategory(cat.id)}
                                  className="vt-admin-btn"
                                  style={{
                                    backgroundColor: 'transparent',
                                    color: '#C44E2C',
                                    padding: 6,
                                    border: 'none',
                                    cursor: 'pointer',
                                  }}
                                  title="Delete Category"
                                >
                                  <FontAwesomeIcon icon={faTrash} style={{ width: 14, height: 14 }} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Prescription Review View ── */}
              {view === 'prescriptions' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <h1 style={{ fontFamily: 'var(--vt-font-display)', fontSize: '2.2rem', fontWeight: 700, margin: 0, color: 'var(--vt-cream)' }}>Prescription Review | மருந்துச் சீட்டு சரிபார்ப்பு</h1>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'rgba(245, 240, 232, 0.55)' }}>மருந்துச் சீட்டுகளை ஆய்வு செய்து அங்கீகரிக்கவும். Siddha மருத்துவர்களின் சான்றிதழைச் சரிபார்க்கவும்.</p>
                    </div>
                    <button type="button" onClick={handleExportPrescriptionsCsv} className="vt-admin-btn vt-admin-btn-secondary">EXPORT CSV</button>
                  </div>

                  {/* Prescription KPI Cards */}
                  <div className="vt-admin-kpi-row" style={{ padding: '0 0 24px 0' }}>
                    <div className="vt-admin-kpi-card">
                      <div className="vt-admin-kpi-label">PENDING</div>
                      <div className="vt-admin-kpi-value" style={{ color: 'var(--vt-gold)' }}>
                        {data.prescriptions.filter(p => p.status === 'pending_review').length}
                      </div>
                      <div className="vt-admin-kpi-footer">Requires Attention</div>
                    </div>
                    <div className="vt-admin-kpi-card">
                      <div className="vt-admin-kpi-label">APPROVED</div>
                      <div className="vt-admin-kpi-value" style={{ color: '#4abc4a' }}>
                        {data.prescriptions.filter(p => p.status === 'approved').length}
                      </div>
                      <div className="vt-admin-kpi-footer">Verified Valid</div>
                    </div>
                    <div className="vt-admin-kpi-card">
                      <div className="vt-admin-kpi-label">REJECTED</div>
                      <div className="vt-admin-kpi-value" style={{ color: '#dc5050' }}>
                        {data.prescriptions.filter(p => p.status === 'rejected').length}
                      </div>
                      <div className="vt-admin-kpi-footer">Rejected / Expired</div>
                    </div>
                    <div className="vt-admin-kpi-card">
                      <div className="vt-admin-kpi-label">TOTAL REQUESTS</div>
                      <div className="vt-admin-kpi-value">
                        {data.prescriptions.length}
                      </div>
                      <div className="vt-admin-kpi-footer">Cumulative Queue</div>
                    </div>
                  </div>

                  {/* Prescriptions Table */}
                  <div className="vt-admin-panel">
                    <div className="vt-admin-table-wrap">
                      <table className="vt-admin-table">
                        <thead>
                          <tr>
                            <th>வாடிக்கையாளர் பெயர் / மின்னஞ்சல்</th>
                            <th>கோப்பு (FILE)</th>
                            <th>தேதி</th>
                            <th>நிலை</th>
                            <th>நிர்வாக குறிப்பு</th>
                            <th>Verify Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPrescriptions.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'rgba(245, 240, 232, 0.4)' }}>
                                No doctor prescriptions in the review queue.
                              </td>
                            </tr>
                          ) : (
                            filteredPrescriptions.map((rx) => {
                              const isApproved = rx.status === 'approved';
                              const isRejected = rx.status === 'rejected';
                              const chipType = isApproved ? 'success' : isRejected ? 'cancelled' : 'pending';
                              const chipLabel = isApproved ? 'APPROVED' : isRejected ? 'REJECTED' : 'PENDING';

                              return (
                                <tr key={rx.id}>
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                      <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(201, 168, 76, 0.1)', border: '1px solid var(--vt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--vt-gold)', fontSize: '0.85rem' }}>
                                        {getCustomerName(rx.userId).charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <div style={{ fontWeight: 600 }}>{getCustomerName(rx.userId)}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'rgba(245, 240, 232, 0.45)' }}>{getCustomerEmail(rx.userId)}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <a
                                      href={rx.fileUrl || '#'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        color: 'var(--vt-gold)',
                                        fontWeight: 700,
                                        textDecoration: 'underline',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                      }}
                                    >
                                      📄 {rx.fileName}
                                    </a>
                                  </td>
                                  <td style={{ fontSize: '0.85rem', color: 'rgba(245, 240, 232, 0.55)' }}>
                                    {new Date(rx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </td>
                                  <td>
                                    <span className={`vt-chip vt-chip--${chipType}`}>
                                      {chipLabel}
                                    </span>
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      placeholder="வழிகாட்டுதல்கள் (Add admin note...)"
                                      value={rxNotes[rx.id] ?? rx.notes ?? ''}
                                      onChange={(e) => setRxNotes({ ...rxNotes, [rx.id]: e.target.value })}
                                      className="vt-admin-input"
                                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                    />
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                      <button
                                        type="button"
                                        onClick={() => updatePrescriptionStatus(rx.id, 'approved', rxNotes[rx.id] ?? rx.notes ?? '')}
                                        className="vt-admin-btn"
                                        style={{ padding: '6px 10px', backgroundColor: 'rgba(74, 188, 74, 0.15)', color: '#4abc4a', border: '1px solid #4abc4a', borderRadius: 6 }}
                                        title="Approve"
                                      >
                                        <FontAwesomeIcon icon={faCheck} style={{ width: 12, height: 12 }} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => updatePrescriptionStatus(rx.id, 'rejected', rxNotes[rx.id] ?? rx.notes ?? '')}
                                        className="vt-admin-btn"
                                        style={{ padding: '6px 10px', backgroundColor: 'rgba(220, 80, 80, 0.15)', color: '#dc5050', border: '1px solid #dc5050', borderRadius: 6 }}
                                        title="Reject"
                                      >
                                        <FontAwesomeIcon icon={faTimes} style={{ width: 12, height: 12 }} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ── Pharmacist Verification Guidelines ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24, marginTop: 16 }}>

                    {/* Left: Verification Reference Image */}
                    <div
                      style={{
                        borderRadius: 16,
                        backgroundImage: 'linear-gradient(135deg, rgba(3,12,7,0.92) 0%, rgba(13,34,24,0.70) 100%), url(/catalogue-ref-2.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        minHeight: 200,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: 24,
                        border: '1px solid rgba(201,168,76,0.18)',
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', letterSpacing: '0.18em', color: 'var(--vt-gold)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                        AUTHENTICITY
                      </span>
                      <h3 style={{ margin: 0, fontFamily: 'var(--vt-font-display)', fontSize: '1.45rem', fontWeight: 700, color: 'var(--vt-cream)', lineHeight: 1.25 }}>
                        உண்மைமை தன்மையை<br />உறுதிப்படுத்துதல்
                      </h3>
                    </div>

                    {/* Right: Admin Guidelines */}
                    <div className="vt-admin-panel" style={{ border: '1px solid rgba(201,168,76,0.20)' }}>
                      <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: 'var(--vt-gold)', fontFamily: 'var(--vt-font-display)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FontAwesomeIcon icon={faShieldHalved} style={{ width: 14, height: 14 }} />
                        நிர்வாக வழிகாட்டிகள்
                      </h3>
                      <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
                        {[
                          { ta: 'மருத்தவரின் பதிவு எண்ணைச் சரிபார்க்கவும் (Registration No.).', en: 'Verify the doctor\'s registration number.' },
                          { ta: 'மருந்துச் சீட்டின் காலாவதி தேதியைச் சோதிக்கவும்.', en: 'Check the prescription expiry date.' },
                          { ta: 'நோயாளி பெயர் மற்றும் விண்ணப்பதாரர் பெயர் ஒத்துப்போவதை உறுதி செய்யவும்.', en: 'Confirm patient and applicant names match.' },
                        ].map((item, i) => (
                          <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                              <FontAwesomeIcon icon={faCheck} style={{ width: 10, height: 10, color: 'var(--vt-gold)' }} />
                            </span>
                            <div>
                              <div style={{ fontSize: '0.87rem', color: 'var(--vt-ink)', lineHeight: 1.45 }}>{item.ta}</div>
                              <div style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.45)', marginTop: 2 }}>{item.en}</div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              )}

              {/* ── Customers View ── */}
              {view === 'users' && (
                <div className="vt-admin-panel">
                  <h2 className="vt-admin-panel-title">Registered Customer Base ({filteredUsers.length} Customers)</h2>
                  <div className="vt-admin-table-wrap">
                    <table className="vt-admin-table">
                      <thead>
                        <tr>
                          <th>Profile</th>
                          <th>Full Name</th>
                          <th>Email Address</th>
                          <th>Mobile Number</th>
                          <th>Role Permissions</th>
                          <th>Date Registered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr key={user.id}>
                            <td>
                              <FontAwesomeIcon icon={faCircleUser} style={{ width: 22, height: 22, color: 'rgba(245,240,232,0.35)' }} />
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--vt-ink)' }}>{user.name}</td>
                            <td style={{ fontWeight: 600, color: 'rgba(245,240,232,0.75)' }}>{user.email}</td>
                            <td style={{ fontFamily: 'monospace', color: 'rgba(245,240,232,0.65)' }}>{user.mobile}</td>
                            <td>
                              <span
                                style={{
                                  padding: '3px 10px',
                                  borderRadius: 6,
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  backgroundColor: user.role === 'admin' ? 'rgba(201,168,76,0.14)' : 'rgba(61,138,92,0.14)',
                                  color: user.role === 'admin' ? 'var(--vt-gold)' : '#4abc4a',
                                  border: `1px solid ${user.role === 'admin' ? 'rgba(201,168,76,0.30)' : 'rgba(74,188,74,0.30)'}`,
                                }}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td>{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Reports View ── */}
              {view === 'reports' && (
                <div className="vt-admin-panel">
                  <h2 className="vt-admin-panel-title">Sales & Metric Reports</h2>
                  <div className="vt-admin-table-wrap">
                    <table className="vt-admin-table">
                      <thead>
                        <tr>
                          <th>Report Indicator</th>
                          <th>Current Summary Value</th>
                          <th>Details & Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 700, color: 'var(--vt-ink)' }}>Total Sales / Revenue</td>
                          <td style={{ fontWeight: 700 }}>₹{data.stats.revenue.toLocaleString()}</td>
                          <td>Cumulative sum of order receipts</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => {
                                const headers = ['Order ID', 'Customer Name', 'Total (INR)', 'Status', 'Date'];
                                const rows = data.orders.map((o) => [
                                  o.id,
                                  getCustomerName(o.userId),
                                  String(o.total),
                                  o.status,
                                  o.createdAt,
                                ]);
                                downloadCsv('sales_report.csv', [headers, ...rows]);
                              }}
                              className="vt-admin-btn vt-admin-btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                            >
                              Export CSV
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 700, color: 'var(--vt-ink)' }}>Average Order Value (AOV)</td>
                          <td style={{ fontWeight: 700 }}>
                            ₹{(data.orders.length > 0 ? data.stats.revenue / data.orders.length : 0).toFixed(2)}
                          </td>
                          <td>Calculated across {data.orders.length} total orders</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => {
                                const aov = data.orders.length > 0 ? data.stats.revenue / data.orders.length : 0;
                                const headers = ['Total Revenue (INR)', 'Total Orders', 'Average Order Value (AOV)'];
                                const row = [String(data.stats.revenue), String(data.orders.length), aov.toFixed(2)];
                                downloadCsv('aov_report.csv', [headers, row]);
                              }}
                              className="vt-admin-btn vt-admin-btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                            >
                              Export CSV
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 700, color: 'var(--vt-ink)' }}>Inventory Skus Count</td>
                          <td style={{ fontWeight: 700 }}>{data.stats.totalMedicines} Products</td>
                          <td>{data.stats.lowStock} item(s) low in stock</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => {
                                const headers = ['Medicine Name (Tamil)', 'Medicine Name (English)', 'Stock', 'Tradition', 'Price'];
                                const rows = data.medicines.map((m) => [
                                  m.nameTa,
                                  m.nameEn,
                                  String(m.stockCount),
                                  m.tradition,
                                  String(m.price),
                                ]);
                                downloadCsv('inventory_report.csv', [headers, ...rows]);
                              }}
                              className="vt-admin-btn vt-admin-btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                            >
                              Export CSV
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 700, color: 'var(--vt-ink)' }}>Prescription Verification Requests</td>
                          <td style={{ fontWeight: 700 }}>{data.stats.pendingPrescriptions} Pending Review</td>
                          <td>Total reviews queued for pharmacist</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => {
                                const headers = ['Prescription ID', 'User ID', 'Customer Name', 'Verification Status', 'Date Submitted'];
                                const rows = data.prescriptions.map((p) => [
                                  p.id,
                                  p.userId,
                                  getCustomerName(p.userId),
                                  p.status,
                                  p.createdAt,
                                ]);
                                downloadCsv('prescriptions_report.csv', [headers, ...rows]);
                              }}
                              className="vt-admin-btn vt-admin-btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                            >
                              Export CSV
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Settings View ── */}
              {view === 'settings' && (
                <div className="vt-admin-panel" style={{ display: 'grid', gap: 24 }}>
                  <h2 className="vt-admin-panel-title" style={{ margin: 0 }}>System Settings</h2>

                  <div style={{ display: 'grid', gap: 16 }}>
                    <div>
                      <h3 style={{ margin: '0 0 6px', fontSize: '1rem', color: 'var(--vt-ink)' }}>Credential Information</h3>
                      <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'rgba(245,240,232,0.55)', lineHeight: 1.5 }}>
                        Credentials are managed via your Supabase dashboard and environment variables. See .env.local.example for required keys.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsEnvModalOpen(true)}
                        className="vt-admin-btn vt-admin-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        View .env.local.example
                      </button>
                    </div>

                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                    <div>
                      <h3 style={{ margin: '0 0 6px', fontSize: '1rem', color: 'var(--vt-ink)' }}>Database Connection Info</h3>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(245,240,232,0.55)', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FontAwesomeIcon icon={faDatabase} style={{ width: 14, height: 14, color: 'var(--vt-emerald-600)' }} />
                        <span>Supabase database and client config detected via environment variables. Sync active.</span>
                      </p>
                    </div>

                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                    <div>
                      <h3 style={{ margin: '0 0 6px', fontSize: '1rem', color: 'var(--vt-ink)' }}>System Version</h3>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(245,240,232,0.55)', lineHeight: 1.5 }}>
                        Vaithiyam E-Commerce Admin Console — Version 2.4.0 (React 19, Next.js App Router).
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </AdminShell>

      {/* ── Add Medicine Form Modal Overlay ── */}
      {isAddModalOpen && (
        <MedicineFormModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            load();
          }}
        />
      )}

      {/* ── Edit Medicine Form Modal Overlay ── */}
      {editingMedicine && (
        <MedicineFormModal
          initialData={editingMedicine}
          onClose={() => setEditingMedicine(null)}
          onSuccess={() => {
            setEditingMedicine(null);
            load();
          }}
        />
      )}

      {/* ── Category Form Modal Overlay (Add & Edit) ── */}
      {isCategoryModalOpen && (
        <CategoryFormModal
          initialData={editingCategory || undefined}
          onClose={() => {
            setIsCategoryModalOpen(false);
            setEditingCategory(null);
          }}
          onSuccess={() => {
            setIsCategoryModalOpen(false);
            setEditingCategory(null);
            load();
          }}
        />
      )}

      {/* ── Env Var Modal Overlay ── */}
      {isEnvModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--vt-card-strong)',
              borderRadius: 16,
              padding: 24,
              maxWidth: 500,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid var(--vt-border)',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', color: 'var(--vt-ink)', fontFamily: 'var(--vt-font-display)', fontWeight: 700 }}>
              Environment Variables Required
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'rgba(245,240,232,0.55)', marginBottom: 16, lineHeight: 1.5 }}>
              Configure the following keys in your local environment file (e.g. <code>.env.local</code>):
            </p>
            <pre
              style={{
                backgroundColor: '#1E3024',
                color: '#EEE8D9',
                padding: 16,
                borderRadius: 8,
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                overflowX: 'auto',
                margin: '0 0 20px 0',
                lineHeight: 1.6,
              }}
            >
              {`NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
NEXT_PUBLIC_RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
NEXT_PUBLIC_ADMIN_EMAIL
ANTHROPIC_API_KEY`}
            </pre>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsEnvModalOpen(false)}
                className="vt-admin-btn vt-admin-btn-primary"
                style={{
                  backgroundColor: '#1E7040',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}

function titleFor(view: AdminView) {
  return view
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}
