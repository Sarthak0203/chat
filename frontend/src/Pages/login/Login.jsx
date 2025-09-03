import React, { useState, useContext, useEffect } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { UserContext } from '../../UserContextProvider';
import './Login.css';

const Login = () => {
  const { user, setUser } = useContext(UserContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [redirect, setRedirect] = useState(false);
  const location = useLocation();

  async function login(e) {
    e.preventDefault();
    const response = await fetch('http://localhost:9000/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const data = await response.json();
    if (response.ok) {
      alert('Login Successful');
      setUser(data.user);
      localStorage.setItem('token', data.token);
      setRedirect(true);
    } else {
      alert('Login Failed');
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      fetchUserData(token);
    }
  }, [location]);

  const fetchUserData = async (token) => {
    try {
      const response = await fetch('http://localhost:9000/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user); // Ensure data.user contains avatar
        setRedirect(true);
      } else {
        alert('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  if (redirect) {
    return <Navigate to={'/chat'} />;
  }

  return (
    <div className="loginWrap">
      <div className="background">
        <div className="shape"></div>
        <div className="shape"></div>
      </div>
      <form className='form' onSubmit={login}>
        <h3>Login Here</h3>
        <label className='label' name="username">Username</label>
        <input className='inp' type="text" placeholder="Email or Phone" id="username" onChange={(e) => { setEmail(e.target.value) }} />

        <label className='label' name="password">Password</label>
        <input className='inp' type="password" placeholder="Password" id="password" onChange={(e) => { setPassword(e.target.value) }} />
        <button className='loginbtn'>Log In</button>
        <p className='signuplogin'>Don't have an account? <Link to="/signup">Sign Up</Link> </p>
        <div className="social">
          <button type="button" class="google-sign-in-button" >
            <a href="http://localhost:9000/auth/google">Sign in with Google</a>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
