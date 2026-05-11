import { useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../hooks/useAuth.jsx';

const SELLERS = [
  'Agus Hautcoeur', 'Bauti Briscioli', 'Cami Briscioli', 'Cami Pariente', 'Cami Svendsen',
  'Cande Stoisa', 'Caro Reymundi', 'Cata Gari', 'Cata Schafer', 'Chompy',
  'Clari PP', 'Cuba', 'Delfi Garcia', 'Dexter', 'Eze',
  'Fede', 'Ferri', 'Franco Rubino', 'German', 'Giri',
  'Greta', 'Guada', 'Guido', 'Juampi', 'Juani Sara xd',
  'Juli K', 'Julibu', 'Lu Diaz', 'Maga', 'Mai',
  'Marti Telechea', 'Mate', 'Mica Azzari', 'Mily Rizzo', 'Pelado',
  'Rave', 'Santi Bianchi', 'Santi Briscioli', 'Trini', 'Valen Briscioli',
  'Valen Guzman', 'Vicky',
];

export default function SellerPage() {
  const { auth, logout } = useAuth();
  const [form, setForm] = useState({ buyerName: '', buyerEmail: '', sellerName: '', quantity: 1 });
  const [step, setStep] = useState('form'); // form | confirm | success | error
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.createSale({ ...form, quantity: Number(form.quantity) }, auth.token);
      setResult(data);
      setStep('success');
    } catch (err) {
      setError(err.message);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm({ buyerName: '', buyerEmail: '', sellerName: '', quantity: 1 });
    setStep('form');
    setResult(null);
    setError('');
  };

  if (step === 'success') {
    return (
      <Screen title="✅ Venta confirmada" onLogout={logout}>
        <div style={s.successCard}>
          <p style={s.successName}>{result.sale.buyer_name}</p>
          <p style={s.successSub}>
            {result.tickets.length} {result.tickets.length === 1 ? 'entrada enviada' : 'entradas enviadas'} a
          </p>
          <p style={s.successEmail}>{result.sale.buyer_email}</p>
          {result.warning && <p style={s.warn}>{result.warning}</p>}
        </div>
        <button onClick={reset} style={s.btn}>Nueva venta</button>
      </Screen>
    );
  }

  if (step === 'error') {
    return (
      <Screen title="❌ Error" onLogout={logout}>
        <p style={s.errorMsg}>{error}</p>
        <button onClick={() => setStep('confirm')} style={s.btn}>Reintentar</button>
        <button onClick={reset} style={{ ...s.btn, ...s.btnSecondary }}>Cancelar</button>
      </Screen>
    );
  }

  if (step === 'confirm') {
    return (
      <Screen title="Confirmar venta" onLogout={logout}>
        <div style={s.confirmCard}>
          <Row label="Comprador" value={form.buyerName} />
          <Row label="Email" value={form.buyerEmail} />
          <Row label="Vendedor" value={form.sellerName} />
          <Row label="Entradas" value={form.quantity} />
        </div>
        <p style={s.confirmNote}>
          Se generarán {form.quantity} QR únicos y se enviarán al email ingresado.
        </p>
        <button onClick={handleConfirm} disabled={loading} style={s.btn}>
          {loading ? 'Procesando...' : '✓ Confirmar y enviar'}
        </button>
        <button onClick={() => setStep('form')} style={{ ...s.btn, ...s.btnSecondary }}>
          Volver a editar
        </button>
      </Screen>
    );
  }

  return (
    <Screen title="🛒 Nueva venta" onLogout={logout}>
      <div style={s.form}>
        <Field label="Nombre del comprador" required>
          <input style={s.input} value={form.buyerName} onChange={set('buyerName')} placeholder="Ej: Juan García" />
        </Field>
        <Field label="Email del comprador" required>
          <input style={s.input} type="email" value={form.buyerEmail} onChange={set('buyerEmail')} placeholder="juan@email.com" />
        </Field>
        <Field label="Nombre del vendedor" required>
          <input
            style={s.input}
            value={form.sellerName}
            onChange={set('sellerName')}
            list="sellers-list"
            placeholder="Escribí tu nombre"
            autoComplete="off"
          />
          <datalist id="sellers-list">
            {SELLERS.map((name) => <option key={name} value={name} />)}
          </datalist>
          {form.sellerName.trim() && !SELLERS.includes(form.sellerName.trim()) && (
            <span style={s.fieldError}>Ese nombre no está en la lista de vendedores</span>
          )}
        </Field>
        <Field label="Cantidad de entradas">
          <div style={s.qtyRow}>
            <button type="button" style={s.qtyBtn} onClick={() => setForm((f) => ({ ...f, quantity: Math.max(1, f.quantity - 1) }))}>−</button>
            <span style={s.qtyNum}>{form.quantity}</span>
            <button type="button" style={s.qtyBtn} onClick={() => setForm((f) => ({ ...f, quantity: Math.min(20, f.quantity + 1) }))}>+</button>
          </div>
        </Field>
        <button
          style={s.btn}
          onClick={() => {
            if (!form.buyerName.trim() || !form.buyerEmail.trim() || !SELLERS.includes(form.sellerName.trim())) return;
            setStep('confirm');
          }}
          disabled={!form.buyerName.trim() || !form.buyerEmail.trim() || !SELLERS.includes(form.sellerName.trim())}
        >
          Continuar →
        </button>
      </div>
    </Screen>
  );
}

function Screen({ title, onLogout, children }) {
  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h1 style={s.headerTitle}>{title}</h1>
        <button onClick={onLogout} style={s.logoutBtn}>Salir</button>
      </div>
      <div style={s.content}>{children}</div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}{required && ' *'}</label>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={s.row}>
      <span style={s.rowLabel}>{label}</span>
      <span style={s.rowValue}>{value}</span>
    </div>
  );
}

const s = {
  wrap: { minHeight: '100vh', background: '#f3f0ff', display: 'flex', flexDirection: 'column' },
  header: { background: '#6d28d9', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { margin: 0, fontSize: 18, fontWeight: 600 },
  logoutBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  content: { padding: 20, maxWidth: 480, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 16, background: '#fff', outline: 'none', boxSizing: 'border-box', width: '100%' },
  qtyRow: { display: 'flex', alignItems: 'center', gap: 16 },
  qtyBtn: { width: 44, height: 44, borderRadius: 10, border: '1.5px solid #6d28d9', background: '#fff', color: '#6d28d9', fontSize: 22, fontWeight: 700, cursor: 'pointer' },
  qtyNum: { fontSize: 28, fontWeight: 700, color: '#1a1a2e', minWidth: 40, textAlign: 'center' },
  btn: { padding: 14, background: '#6d28d9', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: 'pointer', width: '100%' },
  btnSecondary: { background: '#fff', color: '#6d28d9', border: '1.5px solid #6d28d9', marginTop: 8 },
  confirmCard: { background: '#fff', borderRadius: 12, padding: '4px 0', marginBottom: 8 },
  row: { display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f3f4f6' },
  rowLabel: { fontSize: 13, color: '#6b7280' },
  rowValue: { fontSize: 14, fontWeight: 600, color: '#111' },
  confirmNote: { fontSize: 13, color: '#6b7280', textAlign: 'center', margin: '0 0 8px' },
  successCard: { background: '#fff', borderRadius: 12, padding: 24, textAlign: 'center' },
  successName: { fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 8px' },
  successSub: { fontSize: 14, color: '#6b7280', margin: '0 0 4px' },
  successEmail: { fontSize: 15, color: '#6d28d9', fontWeight: 600, margin: '0 0 16px' },
  warn: { background: '#fffbea', border: '1px solid #fcd34d', borderRadius: 8, padding: 12, fontSize: 13, color: '#92400e', marginTop: 8 },
  errorMsg: { color: '#dc2626', textAlign: 'center', fontSize: 15, padding: 16, background: '#fef2f2', borderRadius: 10 },
  fieldError: { fontSize: 12, color: '#dc2626', marginTop: 2 },
};
