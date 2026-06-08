import { db } from '@/lib/mockDb';

export function getAdminStats() {
  const today = new Date().toISOString().slice(0, 10);
  const orders = Array.from(db.orders.values());
  const prescriptions = Array.from(db.prescriptions.values());

  return {
    totalMedicines: db.products.length,
    ordersToday: orders.filter((order) => order.createdAt.slice(0, 10) === today).length,
    pendingPrescriptions: prescriptions.filter((prescription) => prescription.status === 'pending_review').length,
    lowStock: db.products.filter((product) => product.stockCount > 0 && product.stockCount <= 15).length,
    revenue: orders.reduce((sum, order) => sum + order.total, 0),
  };
}

export function isAdminUser(userId: string | null) {
  if (!userId) return false;
  return db.getUserById(userId)?.role === 'admin';
}
