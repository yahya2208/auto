import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';
import { Home, Search, PlusCircle, Heart, User, Car } from 'lucide-react';

// Screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import AddListingScreen from './screens/AddListingScreen';
import ProfileScreen from './screens/ProfileScreen';
import SellerProfileScreen from './screens/SellerProfileScreen';
import ListingDetailScreen from './screens/ListingDetailScreen';

// Main Layout with Bottom Nav
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="app-container">
      {/* Background Orbs */}
      <div className="orb orb-red"></div>
      <div className="orb orb-blue"></div>
      
      <main className="main-content">
        {children}
      </main>

      <nav className="bottom-nav">
        <Link to="/" className={`nav-item ${window.location.pathname === '/' ? 'active' : ''}`}>
          <Home size={24} />
          <span>الرئيسية</span>
        </Link>
        <Link to="/" className="nav-item">
          <Search size={24} />
          <span>بحث</span>
        </Link>
        <Link to="/add" className="nav-item nav-item-add">
          <div className="add-btn-gradient">
            <PlusCircle size={28} color="#fff" />
          </div>
        </Link>
        <Link to="/" className="nav-item">
          <Heart size={24} />
          <span>المفضلة</span>
        </Link>
        <Link to="/profile" className={`nav-item ${window.location.pathname === '/profile' ? 'active' : ''}`}>
          <User size={24} />
          <span>حسابي</span>
        </Link>
      </nav>
    </div>
  );
};

// Protect Routes
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuthStore();
  if (loading) return <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>جاري التحميل...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <MainLayout>{children}</MainLayout>;
};

function App() {
  const { setSession, fetchProfile } = useAuthStore();

  useEffect(() => {
    // Initial Auth State Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, fetchProfile]);

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        
        {/* Public/Protected Hybrid */}
        <Route path="/" element={<PrivateRoute><HomeScreen /></PrivateRoute>} />
        <Route path="/add" element={<PrivateRoute><AddListingScreen /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfileScreen /></PrivateRoute>} />
        
        {/* Detailed Views */}
        <Route path="/listing/:id" element={<PrivateRoute><ListingDetailScreen /></PrivateRoute>} />
        <Route path="/seller/:qrToken" element={<PrivateRoute><SellerProfileScreen /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
