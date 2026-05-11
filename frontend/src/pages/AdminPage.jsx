import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../hooks/useAuth.jsx';

export default function AdminPage() {
  const { auth, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('stats');

  const load = async () => {
    setLoading(true);
    try {
      const [statsData, salesData] = await Promise.all([
        api.getStats(auth.token),
        api.getSales(auth.token),
      ]);
      setStats(statsData);
      setSales(salesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pct = stats ? Math.round((Number(stats.used) / Math.max(Number(stats.total), 1)) * 100) : 0;

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h1 style={s.headerTitle}>📊 Admin</h1>
        <div style={s.headerRight}>
          <button onClick={load} style={s.refreshBtn}>↻</button>
          <button onClick={logout} style={s.logoutBtn}>Salir</button>
        </div>
      </div>

      <div style={s.tabs}>
        <button onClick={() => setTab('stats')} style={{ ...s.tab, ...(tab === 'stats' ? s.tabActive : {}) }}>Estadísticas</button>
        <button onClick={() => setTab('sales')} style={{ ...s.tab, ...(tab === 'sales' ? s.tabActive : {}) }}>Ventas</button>
      </div>

      <div style={s.content}>
        {loading ? (
          <p style={s.loading}>Cargando...</p>
        ) : tab === 'stats' ? (
          <StatsView stats={stats} pct={pct} />
        ) : (
          <SalesView sales={sales} />
        )}
      </div>
    </div>
  );
}

function StatsView({ stats, pct }) {
  if (!stats) return null;
  const cards = [
    { label: 'Total generadas', value: stats.total, color: '#6d28d9' },
    { label: 'Válidas', value: stats.valid, color: '#2563eb' },
    { label: 'Usadas', value: stats.used, color: '#16a34a' },
    { label: 'Canceladas', value: stats.cancelled, color: '#dc2626' },
  ];
  return (
    <div>
      <div style={s.statGrid}>
        {cards.map((c) => (
          <div key={c.label} style={s.statCard}>
            <div style={{ ...s.statNum, color: c.color }}>{c.value}</div>
            <div style={s.statLabel}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={s.progressWrap}>
        <div style={s.progressHeader}>
          <span style={s.progressLabel}>Entradas usadas</span>
          <span style={s.progressPct}>{pct}%</span>
        </div>
        <div style={s.progressTrack}>
          <div style={{ ...s.progressBar, width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

function SalesView({ sales }) {
  if (!sales.length) return <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: 40 }}>No hay ventas registradas</p>;

  const byVendedor = {};
  sales.forEach((sale) => {
    const name = sale.seller_name || 'Sin vendedor';
    if (!byVendedor[name]) byVendedor[name] = { ventas: 0, entradas: 0 };
    byVendedor[name].ventas++;
    byVendedor[name].entradas += Number(sale.total_tickets);
  });
  const vendedores = Object.entries(byVendedor).sort((a, b) => b[1].entradas - a[1].entradas);

  return (
    <div>
      <div style={s.sellerSection}>
        <p style={s.sellerTitle}>Por vendedor</p>
        {vendedores.map(([name, data]) => (
          <div key={name} style={s.sellerRow}>
            <span style={s.sellerName}>{name}</span>
            <div style={s.sellerStats}>
              <span style={s.sellerBadge}>{data.entradas} entradas</span>
              <span style={s.sellerSub}>{data.ventas} {data.ventas === 1 ? 'venta' : 'ventas'}</span>
            </div>
          </div>
        ))}
      </div>

      <p style={s.sellerTitle}>Detalle de ventas</p>
      <div style={s.salesList}>
        {sales.map((sale) => (
          <div key={sale.id} style={s.saleCard}>
            <div style={s.saleTop}>
              <span style={s.saleName}>{sale.buyer_name}</span>
              <span style={s.saleBadge}>{sale.total_tickets} entradas</span>
            </div>
            <div style={s.saleBottom}>
              <span style={s.saleEmail}>{sale.buyer_email}</span>
              <span style={s.saleUsed}>{sale.used_tickets}/{sale.total_tickets} usadas</span>
            </div>
            <div style={s.saleMeta}>
              <span style={s.saleSeller}>Vendedor: {sale.seller_name}</span>
              <span style={s.saleDate}>{new Date(sale.created_at).toLocaleDateString('es-AR')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  wrap: { minHeight: '100vh', background: '#f3f0ff', display: 'flex', flexDirection: 'column' },
  header: { background: '#6d28d9', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { margin: 0, fontSize: 18, fontWeight: 600 },
  headerRight: { display: 'flex', gap: 8 },
  refreshBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 16 },
  logoutBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  tabs: { background: '#fff', display: 'flex', borderBottom: '2px solid #e5e7eb' },
  tab: { flex: 1, padding: '12px', background: 'none', border: 'none', fontSize: 14, fontWeight: 500, color: '#6b7280', cursor: 'pointer' },
  tabActive: { color: '#6d28d9', borderBottom: '2px solid #6d28d9', marginBottom: -2 },
  content: { padding: 16, maxWidth: 600, width: '100%', margin: '0 auto' },
  loading: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  statGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 },
  statCard: { background: '#fff', borderRadius: 12, padding: '20px 16px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  statNum: { fontSize: 36, fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: 12, color: '#9ca3af', marginTop: 6, fontWeight: 500 },
  progressWrap: { background: '#fff', borderRadius: 12, padding: 16 },
  progressHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 13, color: '#374151', fontWeight: 500 },
  progressPct: { fontSize: 13, fontWeight: 700, color: '#6d28d9' },
  progressTrack: { height: 12, background: '#e5e7eb', borderRadius: 6, overflow: 'hidden' },
  progressBar: { height: '100%', background: '#6d28d9', borderRadius: 6, transition: 'width 0.5s ease' },
  sellerSection: { background: '#fff', borderRadius: 12, padding: '12px 14px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  sellerTitle: { fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' },
  sellerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6' },
  sellerName: { fontSize: 14, fontWeight: 600, color: '#111' },
  sellerStats: { display: 'flex', alignItems: 'center', gap: 8 },
  sellerBadge: { background: '#f3f0ff', color: '#6d28d9', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20 },
  sellerSub: { fontSize: 12, color: '#9ca3af' },
  salesList: { display: 'flex', flexDirection: 'column', gap: 10 },
  saleCard: { background: '#fff', borderRadius: 12, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  saleTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  saleName: { fontSize: 15, fontWeight: 600, color: '#111' },
  saleBadge: { background: '#f3f0ff', color: '#6d28d9', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20 },
  saleBottom: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  saleEmail: { fontSize: 12, color: '#6b7280' },
  saleUsed: { fontSize: 12, color: '#16a34a', fontWeight: 500 },
  saleMeta: { display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: 6 },
  saleSeller: { fontSize: 11, color: '#9ca3af' },
  saleDate: { fontSize: 11, color: '#9ca3af' },
};
