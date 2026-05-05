import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

const roles = [
  { value: 'seller', label: '🛒 Vendedor', desc: 'Registrar ventas' },
  { value: 'scanner', label: '📷 Scanner', desc: 'Validar entradas' },
  { value: 'admin', label: '📊 Admin', desc: 'Ver reportes' },
];

export default function LoginPage({ onLogin }) {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('seller');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(password, role);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.logo}>🎟️</div>
        <h1 style={styles.title}>Sistema de Entradas</h1>
        <p style={styles.subtitle}>Ingresá para continuar</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.roleGrid}>
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                style={{ ...styles.roleBtn, ...(role === r.value ? styles.roleBtnActive : {}) }}
              >
                <span style={styles.roleEmoji}>{r.label.split(' ')[0]}</span>
                <span style={styles.roleLabel}>{r.label.split(' ')[1]}</span>
                <span style={styles.roleDesc}>{r.desc}</span>
              </button>
            ))}
          </div>

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            autoComplete="current-password"
            required
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f0ff', padding: 16 },
  card: { background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(109,40,217,0.10)' },
  logo: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 700, textAlign: 'center', margin: '0 0 4px', color: '#1a1a2e' },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', margin: '0 0 24px' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  roleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 },
  roleBtn: { border: '2px solid #e5e7eb', borderRadius: 10, padding: '10px 6px', background: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, transition: 'all 0.15s' },
  roleBtnActive: { borderColor: '#6d28d9', background: '#f3f0ff' },
  roleEmoji: { fontSize: 22 },
  roleLabel: { fontSize: 12, fontWeight: 600, color: '#374151' },
  roleDesc: { fontSize: 10, color: '#9ca3af', textAlign: 'center' },
  input: { padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 16, outline: 'none', width: '100%', boxSizing: 'border-box' },
  error: { color: '#dc2626', fontSize: 13, margin: 0, textAlign: 'center' },
  btn: { padding: '14px', background: '#6d28d9', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: 'pointer' },
};
