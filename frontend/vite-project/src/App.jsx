import './App.css'
import Login from './pages/Login.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SignUp from './pages/SignUp'
import Landing from './pages/Landing'
import Home from './pages/Home'
import { AuthProvider } from './context/AuthContext'
import PublicRoute from './components/PublicRoute'
import ProtectedRoute from './components/ProtectedRoute'
import Profile from './pages/Profile'
import socket from './socket'
import { useEffect } from 'react'



function App() {

  useEffect(() => {

    socket.on("connect", () => {
      console.log("Socket connected!");
      console.log("Socket ID:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.log("Connection failed:", error.message);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected!");
    });

    // Manually establish connection
    socket.connect();

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };

  }, []);


  return (
    <>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<PublicRoute><Landing /></PublicRoute>} />
            <Route path='/login' element={<PublicRoute><Login /></PublicRoute>} />
            <Route path='/signup' element={<PublicRoute><SignUp /></PublicRoute>} />
            <Route path='/home' element={<ProtectedRoute><Home /></ProtectedRoute>} />

            <Route path='/profile/:username' element={<ProtectedRoute><Profile /></ProtectedRoute>} />




          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </>
  )
}

export default App
