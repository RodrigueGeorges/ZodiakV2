import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Home from './pages/Home';
import Register from './pages/Register';
import RegisterComplete from './pages/RegisterComplete';
import Subscribe from './pages/Subscribe';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Test from './pages/Test';
import BottomNavBar from './components/BottomNavBar';
import TopNavBar from './components/TopNavBar';
import { useAuth } from './lib/hooks/useAuth';
import PrivateRoute from './components/PrivateRoute';
import GuidanceAccess from './pages/GuidanceAccess';
import GuidanceShortRedirect from './pages/GuidanceShortRedirect';
import ChatAstro from './pages/ChatAstro';
import CosmicLoader from './components/CosmicLoader';
import './index.css';

// Lazy loading des pages principales pour optimiser les performances
const Guidance = lazy(() => import('./pages/Guidance'));
const Natal = lazy(() => import('./pages/Natal'));
const Profile = lazy(() => import('./pages/Profile'));

// Composant de fallback optimisé
const PageLoader = () => (
  <div className="min-h-screen bg-cosmic-900 flex items-center justify-center">
    <CosmicLoader />
  </div>
);

function App() {
  const { user } = useAuth();

  return (
    <>
      {user && <TopNavBar />}
      <Routes>
        {/* Routes publiques (pas d'authentification requise) */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/complete" element={<RegisterComplete />} />
        <Route path="/subscribe" element={<Subscribe />} />
        <Route path="/zodiak-admin-astro" element={<Admin />} />
        <Route path="/test" element={<Test />} />
        
        {/* Routes pour les liens SMS (publiques) */}
        <Route path="/g/:short" element={<GuidanceShortRedirect />} />
        <Route path="/guidance/access" element={<GuidanceAccess />} />
        <Route path="/guide-astral" element={<ChatAstro />} />
        
        {/* Routes avec lazy loading et Suspense (protégées) */}
        <Route 
          path="/profile" 
          element={
            <PrivateRoute>
              <Suspense fallback={<PageLoader />}>
                <Profile />
              </Suspense>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/guidance" 
          element={
            <PrivateRoute>
              <Suspense fallback={<PageLoader />}>
                <Guidance />
              </Suspense>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/natal" 
          element={
            <PrivateRoute>
              <Suspense fallback={<PageLoader />}>
                <Natal />
              </Suspense>
            </PrivateRoute>
          } 
        />
      </Routes>
      {user && <BottomNavBar />}
    </>
  );
}

export default App;