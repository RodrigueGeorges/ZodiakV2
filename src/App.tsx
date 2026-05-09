import { Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Home from './pages/Home';
import Register from './pages/Register';
import RegisterComplete from './pages/RegisterComplete';
import Subscribe from './pages/Subscribe';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Admin from './pages/Admin';
import BottomNavBar from './components/BottomNavBar';
import TopNavBar from './components/TopNavBar';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { useAuth } from './lib/hooks/useAuth';
import PrivateRoute from './components/PrivateRoute';
import GuidanceAccess from './pages/GuidanceAccess';
import GuidanceShortRedirect from './pages/GuidanceShortRedirect';
import ChatAstro from './pages/ChatAstro';
import ReferralLanding from './pages/ReferralLanding';
import LoadingScreen from './components/LoadingScreen';
import { identify, trackPageView } from './lib/analytics';
import './index.css';

const StarParticleCursor = lazy(() => import('./components/effects/StarParticleCursor'));

const Guidance = lazy(() => import('./pages/Guidance'));
const Natal = lazy(() => import('./pages/Natal'));
const Profile = lazy(() => import('./pages/Profile'));
const Friends = lazy(() => import('./pages/Friends'));
const SynastryDetail = lazy(() => import('./pages/SynastryDetail'));
const Calendar = lazy(() => import('./pages/Calendar'));

const PageLoader = () => <LoadingScreen message="Préparation de la page…" />;

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

function AnimatedRoutes() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={{
          // Spring physique au lieu d'une cubic-bezier — plus naturel.
          type: 'spring',
          stiffness: 220,
          damping: 28,
          mass: 0.8,
        }}
      >
        <Routes location={location}>
          {/* Routes publiques */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/complete" element={<RegisterComplete />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/subscribe" element={<Subscribe />} />
          <Route path="/zodiak-admin-astro" element={<Admin />} />

          {/* Liens partageables (publiques) */}
          <Route path="/g/:short" element={<GuidanceShortRedirect />} />
          <Route path="/guidance/access" element={<GuidanceAccess />} />
          <Route path="/guide-astral" element={<ChatAstro />} />

          {/* Parrainage */}
          <Route path="/r/:code" element={<ReferralLanding />} />

          {/* Routes protégées (lazy) */}
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
          <Route
            path="/friends"
            element={
              <PrivateRoute>
                <Suspense fallback={<PageLoader />}>
                  <Friends />
                </Suspense>
              </PrivateRoute>
            }
          />
          <Route
            path="/synastry/:id"
            element={
              <PrivateRoute>
                <Suspense fallback={<PageLoader />}>
                  <SynastryDetail />
                </Suspense>
              </PrivateRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <PrivateRoute>
                <Suspense fallback={<PageLoader />}>
                  <Calendar />
                </Suspense>
              </PrivateRoute>
            }
          />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const { user } = useAuth();

  // Identify user for analytics quand connecté
  useEffect(() => {
    if (user?.id) identify(user.id, { email: user.email });
  }, [user?.id, user?.email]);

  return (
    <>
      <Suspense fallback={null}>
        <StarParticleCursor showCursor />
      </Suspense>
      {user && <TopNavBar />}
      <div className="relative z-[20] isolate min-h-[100dvh]">
        <AnimatedRoutes />
      </div>
      {user && <BottomNavBar />}
      {user && <PWAInstallPrompt />}
    </>
  );
}

export default App;
