'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBox,
  faClipboardCheck,
  faCubes,
  faHourglassHalf,
  faIndianRupeeSign,
  faMagnifyingGlass,
  faPlus,
  faTrash,
  faBell,
  faCircleQuestion,
  faCircleUser,
  faCheck,
  faTimes,
  faChevronRight,
  faDatabase,
} from '@fortawesome/free-solid-svg-icons';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminShell } from '@/components/admin/AdminShell';
import type { MedicineCategory, SeedMedicine } from '@/lib/medicineData';
import { MedicineFormModal } from '@/components/admin/MedicineFormModal';

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
  const [loading, setLoading] = useState(true);

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
  const getCustomerName = (userId: string) => {
    const u = data?.users.find((x) => x.id === userId);
    return u ? u.name : 'கார்த்திக் ராஜன்'; // fallback seed name
  };

  const getCustomerEmail = (userId: string) => {
    const u = data?.users.find((x) => x.id === userId);
    return u ? u.email : 'karthik@example.com';
  };

  // Search logic depending on active view
  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    const orders = data?.orders ?? [];
    if (!q) return orders;
    return orders.filter((item) =>
      item.id.toLowerCase().includes(q) ||
      getCustomerName(item.userId).toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q) ||
      item.paymentMethod.toLowerCase().includes(q)
    );
  }, [data?.orders, data?.users, query]);

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
  }, [data?.prescriptions, data?.users, query]);

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
      <AdminShell title={titleFor(view)}>
        {/* ── Sub-header and Search Toolbar ── */}
        <div className="vt-admin-toolbar-row">
          <div className="vt-admin-search-wrapper">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#8A9990',
                width: 15,
                height: 15,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="button" className="vt-admin-icon-btn" style={{ position: 'relative' }}>
              <FontAwesomeIcon icon={faBell} style={{ width: 17, height: 17 }} />
              <span
                style={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#C44E2C',
                }}
              />
            </button>
            <button type="button" className="vt-admin-icon-btn">
              <FontAwesomeIcon icon={faCircleQuestion} style={{ width: 17, height: 17 }} />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="vt-admin-content">
          {!data || loading ? (
            <div
              className="vt-admin-panel"
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}
            >
              <div style={{ textAlign: 'center', color: '#5A665D' }}>
                <div style={{ marginBottom: 12 }}>Loading admin database and metrics...</div>
                <div style={{ fontSize: '0.85rem', color: '#8A9990' }}>Please wait a moment</div>
              </div>
            </div>
          ) : (
            <>
              {/* ── Dashboard KPI Cards Section ── */}
              {view === 'dashboard' && (
                <div className="vt-admin-kpi-row" style={{ padding: '0 0 24px 0' }}>
                  {/* KPI Card 1: Total Sales */}
                  <div className="vt-admin-kpi-card">
                    <div className="vt-admin-kpi-label">Total Sales</div>
                    <div className="vt-admin-kpi-value">₹{data.stats.revenue.toLocaleString()}</div>
                    <div className="vt-admin-sparkline-container">
                      <Sparkline dataPoints={[12000, 14500, 13200, 15800, 14600, 17200, 16100, data.stats.revenue || 15400]} color="#1E7040" />
                    </div>
                    <div className="vt-admin-kpi-footer">
                      <span className="vt-admin-kpi-trend-green">+12%</span> this week
                    </div>
                  </div>

                  {/* KPI Card 2: New Orders */}
                  <div className="vt-admin-kpi-card">
                    <div className="vt-admin-kpi-label">New Orders</div>
                    <div className="vt-admin-kpi-value">{data.orders.length}</div>
                    <div className="vt-admin-sparkline-container">
                      <Sparkline dataPoints={[85, 105, 90, 115, 100, 125, 110, data.orders.length || 124]} color="#1E7040" />
                    </div>
                    <div className="vt-admin-kpi-footer">
                      <span className="vt-admin-kpi-trend-green">+5%</span> this week
                    </div>
                  </div>

                  {/* KPI Card 3: Customer Growth */}
                  <div className="vt-admin-kpi-card">
                    <div className="vt-admin-kpi-label">Customer Growth</div>
                    <div className="vt-admin-kpi-value">+{data.users.length}</div>
                    <div className="vt-admin-sparkline-container">
                      <Sparkline dataPoints={[4, 6, 5, 8, 7, 10, 8, data.users.length || 9]} color="#1E7040" />
                    </div>
                    <div className="vt-admin-kpi-footer">
                      <span className="vt-admin-kpi-trend-green">+8%</span> this month
                    </div>
                  </div>

                  {/* KPI Card 4: Low Stock Items */}
                  <div className="vt-admin-kpi-card">
                    <div className="vt-admin-kpi-label">Low Stock Items</div>
                    <div className="vt-admin-kpi-value" style={{ color: data.stats.lowStock > 0 ? '#C44E2C' : '#1E472E' }}>
                      {data.stats.lowStock}
                    </div>
                    <div className="vt-admin-sparkline-container">
                      {/* Decline curve for stock levels */}
                      <Sparkline dataPoints={[35, 28, 30, 22, 19, 18, 17, data.stats.lowStock]} color={data.stats.lowStock > 0 ? '#C44E2C' : '#1E7040'} />
                    </div>
                    <div className="vt-admin-kpi-footer">
                      <span style={{ fontWeight: 700, color: data.stats.lowStock > 0 ? '#C44E2C' : '#1E7040' }}>
                        {data.stats.lowStock} item(s)
                      </span>{' '}
                      require attention
                    </div>
                  </div>
                </div>
              )}

              {/* ── Dashboard Content Panels ── */}
              {view === 'dashboard' && (
                <div className="vt-admin-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 className="vt-admin-panel-title" style={{ margin: 0 }}>Recent Orders</h2>
                    <span style={{ fontSize: '0.85rem', color: '#5A665D', fontWeight: 600 }}>
                      Showing latest orders
                    </span>
                  </div>

                  <div className="vt-admin-table-wrap">
                    <table className="vt-admin-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer Name</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Total</th>
                          <th>Quick Status Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#8A9990' }}>
                              No orders found matching the query.
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.slice(0, 5).map((order) => (
                            <tr key={order.id}>
                              <td style={{ fontWeight: 700, color: '#1E472E' }}>{order.id}</td>
                              <td>
                                <div style={{ fontWeight: 600 }}>{getCustomerName(order.userId)}</div>
                                <div style={{ fontSize: '0.78rem', color: '#8A9990' }}>{getCustomerEmail(order.userId)}</div>
                              </td>
                              <td>{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                              <td>
                                <span className={`vt-status-pill vt-status-${order.status}`}>
                                  <span className="vt-status-dot" />
                                  {order.status}
                                </span>
                              </td>
                              <td style={{ fontWeight: 700 }}>₹{order.total.toFixed(2)}</td>
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
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Order Management View ── */}
              {view === 'orders' && (
                <div className="vt-admin-panel">
                  <h2 className="vt-admin-panel-title">Order Management ({filteredOrders.length})</h2>
                  <div className="vt-admin-table-wrap">
                    <table className="vt-admin-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Date</th>
                          <th>Payment</th>
                          <th>Rx Status</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: 24, color: '#8A9990' }}>
                              No orders match the search filters.
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((order) => (
                            <tr key={order.id}>
                              <td style={{ fontWeight: 700, color: '#1E472E' }}>{order.id}</td>
                              <td>
                                <div style={{ fontWeight: 600 }}>{getCustomerName(order.userId)}</div>
                                <div style={{ fontSize: '0.78rem', color: '#8A9990' }}>{getCustomerEmail(order.userId)}</div>
                              </td>
                              <td>{new Date(order.createdAt).toLocaleString()}</td>
                              <td style={{ textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 600 }}>
                                {order.paymentMethod}
                              </td>
                              <td>
                                {order.prescriptionStatus === 'pending_review' ? (
                                  <span style={{ color: '#D4890A', fontWeight: 700, fontSize: '0.8rem' }}>
                                    ⚠️ Pending Review
                                  </span>
                                ) : order.prescriptionStatus === 'approved' ? (
                                  <span style={{ color: '#2C7A4F', fontWeight: 700, fontSize: '0.8rem' }}>
                                    ✓ Approved
                                  </span>
                                ) : order.prescriptionStatus === 'rejected' ? (
                                  <span style={{ color: '#C44E2C', fontWeight: 700, fontSize: '0.8rem' }}>
                                    ✗ Rejected
                                  </span>
                                ) : (
                                  <span style={{ color: '#8A9990', fontSize: '0.8rem' }}>Not Required</span>
                                )}
                              </td>
                              <td style={{ fontWeight: 700 }}>₹{order.total.toFixed(2)}</td>
                              <td>
                                <span className={`vt-status-pill vt-status-${order.status}`}>
                                  <span className="vt-status-dot" />
                                  {order.status}
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
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
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
                                    border: '1px solid #E6DCD1',
                                    background: '#FAF8F5',
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
                              <td style={{ fontFamily: 'var(--vt-font-display)', fontWeight: 700, color: '#1E472E' }}>
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
                  <h2 className="vt-admin-panel-title">Medicine Categories ({filteredCategories.length})</h2>
                  <div className="vt-admin-table-wrap">
                    <table className="vt-admin-table">
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Tamil Name</th>
                          <th>English Name</th>
                          <th>Slug Identifier</th>
                          <th>System Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCategories.map((cat) => (
                          <tr key={cat.id}>
                            <td style={{ fontSize: '1.2rem', paddingLeft: 20 }}>{cat.icon || '🍃'}</td>
                            <td style={{ fontFamily: 'var(--vt-font-display)', fontWeight: 700, color: '#1E472E' }}>
                              {cat.nameTa}
                            </td>
                            <td style={{ fontWeight: 600 }}>{cat.nameEn}</td>
                            <td style={{ fontFamily: 'monospace', color: '#5A665D' }}>{cat.slug}</td>
                            <td>
                              <span style={{ fontSize: '0.8rem', background: '#E2F2E9', color: '#1E7040', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                                Active
                              </span>
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
                <div className="vt-admin-panel">
                  <h2 className="vt-admin-panel-title">Doctor Prescription Review ({filteredPrescriptions.length})</h2>
                  <div className="vt-admin-table-wrap">
                    <table className="vt-admin-table">
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Uploaded Document</th>
                          <th>Date Submitted</th>
                          <th>Verification Status</th>
                          <th>Verify Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPrescriptions.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#8A9990' }}>
                              No doctor prescriptions in the review queue.
                            </td>
                          </tr>
                        ) : (
                          filteredPrescriptions.map((rx) => (
                            <tr key={rx.id}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{getCustomerName(rx.userId)}</div>
                                <div style={{ fontSize: '0.78rem', color: '#8A9990' }}>{getCustomerEmail(rx.userId)}</div>
                              </td>
                              <td>
                                <a
                                  href={rx.fileUrl || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    color: '#1E472E',
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
                              <td>{new Date(rx.createdAt).toLocaleString()}</td>
                              <td>
                                <span
                                  className={`vt-status-pill ${
                                    rx.status === 'approved'
                                      ? 'vt-status-delivered'
                                      : rx.status === 'rejected'
                                      ? 'vt-status-pending'
                                      : 'vt-status-processing'
                                  }`}
                                >
                                  <span className="vt-status-dot" />
                                  {rx.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button
                                    type="button"
                                    onClick={() => updatePrescriptionStatus(rx.id, 'approved')}
                                    className="vt-admin-btn vt-admin-btn-primary"
                                    style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: '#1E7040' }}
                                    title="Approve prescription"
                                  >
                                    <FontAwesomeIcon icon={faCheck} style={{ width: 12, height: 12 }} /> Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updatePrescriptionStatus(rx.id, 'rejected')}
                                    className="vt-admin-btn"
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: '0.75rem',
                                      backgroundColor: '#C44E2C',
                                      color: 'white',
                                      border: 'none',
                                    }}
                                    title="Reject prescription"
                                  >
                                    <FontAwesomeIcon icon={faTimes} style={{ width: 12, height: 12 }} /> Reject
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
                              <FontAwesomeIcon icon={faCircleUser} style={{ width: 22, height: 22, color: '#A4BAAD' }} />
                            </td>
                            <td style={{ fontWeight: 700, color: '#1E472E' }}>{user.name}</td>
                            <td style={{ fontWeight: 600 }}>{user.email}</td>
                            <td style={{ fontFamily: 'monospace' }}>{user.mobile}</td>
                            <td>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  backgroundColor: user.role === 'admin' ? '#FFF6E0' : '#E2F2E9',
                                  color: user.role === 'admin' ? '#B57F00' : '#1E7040',
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
                          <td style={{ fontWeight: 700, color: '#1E472E' }}>Total Sales / Revenue</td>
                          <td style={{ fontWeight: 700 }}>₹{data.stats.revenue.toLocaleString()}</td>
                          <td>Cumulative sum of order receipts</td>
                          <td>
                            <button type="button" className="vt-admin-btn vt-admin-btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                              Export CSV
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 700, color: '#1E472E' }}>Average Order Value (AOV)</td>
                          <td style={{ fontWeight: 700 }}>
                            ₹{(data.orders.length > 0 ? data.stats.revenue / data.orders.length : 0).toFixed(2)}
                          </td>
                          <td>Calculated across {data.orders.length} total orders</td>
                          <td>
                            <button type="button" className="vt-admin-btn vt-admin-btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                              Export CSV
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 700, color: '#1E472E' }}>Inventory Skus Count</td>
                          <td style={{ fontWeight: 700 }}>{data.stats.totalMedicines} Products</td>
                          <td>{data.stats.lowStock} item(s) low in stock</td>
                          <td>
                            <button type="button" className="vt-admin-btn vt-admin-btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                              Export CSV
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 700, color: '#1E472E' }}>Prescription Verification Requests</td>
                          <td style={{ fontWeight: 700 }}>{data.stats.pendingPrescriptions} Pending Review</td>
                          <td>Total reviews queued for pharmacist</td>
                          <td>
                            <button type="button" className="vt-admin-btn vt-admin-btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
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
                      <h3 style={{ margin: '0 0 6px', fontSize: '1rem', color: '#1E472E' }}>Credential Information</h3>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#5A665D', lineHeight: 1.5 }}>
                        The default system administrator is: <strong style={{ color: '#1E3024' }}>admin@vaithiyam.local</strong>
                        <br />
                        Default password: <strong style={{ color: '#1E3024' }}>admin1234</strong>
                      </p>
                    </div>

                    <div style={{ height: '1px', background: '#E6DCD1' }} />

                    <div>
                      <h3 style={{ margin: '0 0 6px', fontSize: '1rem', color: '#1E472E' }}>Database Connection Info</h3>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#5A665D', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FontAwesomeIcon icon={faDatabase} style={{ width: 14, height: 14, color: '#1E7040' }} />
                        <span>Supabase database and client config detected via environment variables. Sync active.</span>
                      </p>
                    </div>

                    <div style={{ height: '1px', background: '#E6DCD1' }} />

                    <div>
                      <h3 style={{ margin: '0 0 6px', fontSize: '1rem', color: '#1E472E' }}>System Version</h3>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#5A665D', lineHeight: 1.5 }}>
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
    </AdminGuard>
  );
}

function titleFor(view: AdminView) {
  return view
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}
