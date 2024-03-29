import React, { useState, useEffect } from 'react';
import './App.css';
import ChatPage from './Pages/ChatPage/ChatPage';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from './Pages/login/Login';
import SignUp from './Pages/SignUp/SignUp';
import VideoCall from './Pages/VideoCall/VideoCall'
import { UserContextProvider } from './UserContextProvider';
import AccountPage from './Pages/AccountPage/AccountPage';

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
    <UserContextProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <ChatPage isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} /> : <Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/chat" element={!isAuthenticated ? <Login /> : <ChatPage isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/vc" element={!isAuthenticated ? <Login /> : <VideoCall isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/" element={isAuthenticated ? <ChatPage isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} /> : <Login />} />
          <Route path="/account" element={isAuthenticated ? <AccountPage isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} /> : <Login />} />
        </Routes>
      </BrowserRouter>
    </UserContextProvider>
  );
}

export default App;