import React, { useState, useContext, useEffect } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { UserContext } from '../../UserContextProvider';
import './Login.css'

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
    const data = await response.json(); // Parse response body as JSON
    if (response.ok) {
      alert('Login Successful');
      setUser(data.user); // Assuming the user data is in the 'user' property of the parsed JSON
      // Store the JWT token in localStorage
      localStorage.setItem('token', data.token);
      setRedirect(true); // Set redirect to true here
    } else {
      // Handle login failure
      if (data.error) {
        alert(`Login Failed: ${data.error}`);
      } else {
        alert('Login Failed');
      }
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      // Fetch user data using this token and set it to the context
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
        setUser(data.user); // Set user data in context
        setRedirect(true); // Redirect to /chat
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
          {/* <div className="google"><i className="fab fa-google"></i>  <a href="http://localhost:9000/auth/google">Google</a></div> */}
        </div>
      </form>
    </div>
  )
}

export default Login;
