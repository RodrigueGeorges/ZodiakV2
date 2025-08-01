import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Guidance from './pages/Guidance';
import Natal from './pages/Natal';
import Profile from './pages/Profile';
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
import './index.css';

function App() {
  const { user } = useAuth();

  return (
    <>
      {user && <TopNavBar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/guidance" element={<PrivateRoute><Guidance /></PrivateRoute>} />
        <Route path="/natal" element={<PrivateRoute><Natal /></PrivateRoute>} />
        <Route path="/register/complete" element={<RegisterComplete />} />
        <Route path="/subscribe" element={<Subscribe />} />
        <Route path="/zodiak-admin-astro" element={<Admin />} />
        <Route path="/test" element={<Test />} />
        <Route path="/guidance/access" element={<GuidanceAccess />} />
        <Route path="/g/:short" element={<GuidanceShortRedirect />} />
        <Route path="/guide-astral" element={<ChatAstro />} />
      </Routes>
      {user && <BottomNavBar />}
    </>
  );
}

export default App;