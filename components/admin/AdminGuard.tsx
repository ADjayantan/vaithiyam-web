'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AdminUser {
  id: string;
  name: string;
  role?: string;
}

function getToken(): string | null {
  try {
    return localStorage.getItem('vt_token') ?? sessionStorage.getItem('vt_token');
  } catch {
    return null;
  }
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    fetch('/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.ok ? res.json() : null)
      .then((user: AdminUser | null) => {
        if (user?.role === 'admin') {
          setAllowed(true);
          setReady(true);
        } else {
          router.replace('/admin/login');
        }
      })
      .catch(() => router.replace('/admin/login'));
  }, [router]);

  if (!ready) {
    return (
      <div className="vt-admin-shell" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="vt-admin-card" style={{ padding: 24 }}>Checking admin access...</div>
      </div>
    );
  }

  return allowed ? children : null;
}
