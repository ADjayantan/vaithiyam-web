import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, unauthorized } from '@/lib/apiAuth';
import { db } from '@/lib/mockDb';
import {
  matchesHistoryStatus,
  matchesTimeRange,
  toOrderHistorySummary,
} from '@/lib/orderDto';

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) return unauthorized();

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const timeRange = url.searchParams.get('timeRange');
  const query = (url.searchParams.get('query') ?? url.searchParams.get('search') ?? '').toLowerCase();
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const limit = Math.max(1, Math.min(50, parseInt(url.searchParams.get('limit') ?? '20', 10)));

  let orders = db.getOrdersForUser(userId)
    .filter((order) => matchesHistoryStatus(order, status))
    .filter((order) => matchesTimeRange(order, timeRange));

  if (query) {
    orders = orders.filter((order) =>
      order.id.toLowerCase().includes(query) ||
      order.items.some((item) =>
        item.nameTa.toLowerCase().includes(query) ||
        item.nameEn.toLowerCase().includes(query)
      )
    );
  }

  const start = (page - 1) * limit;
  const pageItems = orders.slice(start, start + limit);

  return NextResponse.json({
    orders: pageItems.map(toOrderHistorySummary),
    total: orders.length,
    hasMore: start + pageItems.length < orders.length,
  });
}
