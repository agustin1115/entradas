import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SellerPage from './pages/SellerPage.jsx';
import ScannerPage from './pages/ScannerPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

function AppContent() {
  const { auth } = useAuth();
  const [loggedIn, setLoggedIn] = useState(!!auth);

  if (!loggedIn || !auth) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />;
  }

  if (auth.role === 'seller') return <SellerPage />;
  if (auth.role === 'scanner') return <ScannerPage />;
  if (auth.role === 'admin') return <AdminPage />;

  return <LoginPage onLogin={() => setLoggedIn(true)} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
