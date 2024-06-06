import React, { useState, useEffect } from 'react';
import './App.css';
import ChatPage from './Pages/ChatPage/ChatPage';
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Login from './Pages/login/Login';
import SignUp from './Pages/SignUp/SignUp';
import VideoCall from './Pages/VideoCall/VideoCall';
import { UserContextProvider } from './UserContextProvider';
import AccountPage from './Pages/AccountPage/AccountPage';
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading...</div>; // or your loading screen
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.envREACT_APP_GOOGLE_CLIENT_ID}>
      <UserContextProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={isAuthenticated ? <ChatPage setIsAuthenticated={setIsAuthenticated} /> : <Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/chat" element={!isAuthenticated ? <Login /> : <ChatPage setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/vc" element={!isAuthenticated ? <Login /> : <VideoCall setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/" element={isAuthenticated ? <ChatPage setIsAuthenticated={setIsAuthenticated} /> : <Login />} />
            <Route path="/account" element={isAuthenticated ? <AccountPage setIsAuthenticated={setIsAuthenticated} /> : <Login />} />
          </Routes>
        </BrowserRouter>
      </UserContextProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
