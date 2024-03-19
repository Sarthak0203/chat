import React, { useState,useContext } from 'react'
import './Login.css'
import {Navigate,Link} from 'react-router-dom';
import { UserContext } from '../../UserContextProvider';


const Login = () => {
  const { user, setUser } = useContext(UserContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [redirect, setRedirect] = useState(false);
    async function login(e){
      e.preventDefault();
      const response = await fetch('http://localhost:9000/login',{
        method:'POST',
        body:JSON.stringify({email,password}),
        headers:{'Content-Type':'Application/json'},
        credentials:'include',
      });
      if(response.ok){
        const data = await response.json(); // Parse response body as JSON
        alert('Login Successful');
        setRedirect(true);
        setUser(data.user); // Assuming the user data is in the 'user' property of the parsed JSON

      }
      else{
        alert('Wrong Credentials');
      }
    }
    if(redirect){
      return <Navigate to = {'/chat'}/>
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
        <input className='inp' type="text" placeholder="Email or Phone" id="username" onChange={(e)=>{setEmail(e.target.value)}}/>

        <label className='label' name="password">Password</label>
        <input className='inp' type="password" placeholder="Password" id="password" onChange={(e)=>{setPassword(e.target.value)}}/>
        <button className='loginbtn'>Log In</button>
        <p className='signuplogin'>Dont have account? <Link to="/signup">Sign Up</Link> </p>
        {/* <div className="social">
          <div className="go"><i className="fab fa-google"></i>  Google</div>
          <div className="fb"><i className="fab fa-facebook"></i>  Facebook</div>
        </div> */}
    </form>
    </div>
  )
}

export default Login