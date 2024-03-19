import React, { useState } from 'react'
import ReactDOM from "react-dom/client";
import { Link } from "react-router-dom";
import './SignUp.css'

const SignUp = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [first_name, setfirst_name] = useState('');
    const [last_name, setlast_name] = useState('');
    


    async function signup(e){
        e.preventDefault();
        const response = await fetch('http://localhost:9000/signup',{
            method:'POST',
            body:JSON.stringify({first_name,last_name,email,password}),
            headers:{'Content-Type':'Application/json'}
        });
        if(response.status===200){
            alert('Registration Successful');
            
        }
        else{
            alert('Registration Failed');
            console.log(response);
        }
        
    }


  return (
    <div className="loginWrap">
    <div className="background">
        <div className="shape"></div>
        <div className="shape"></div>
    </div>
    <form className='signupform' onSubmit={signup}>
        <h3>SignUp Here</h3>
        <label className='label' name="username">First Name</label>
        <input className='inp' type="text" placeholder="First Name" id="first_name" onChange={(e)=>{setfirst_name(e.target.value)}}/>

        <label className='label' name="password">Last Name</label>
        <input className='inp' type="text" placeholder="Last Name" id="last_name" onChange={(e)=>{setlast_name(e.target.value)}}/>
        <label className='label' name="password">Email</label>
        <input className='inp' htmlfor="email" type="email" placeholder="Email" id="email" onChange={(e)=>{setEmail(e.target.value)}}/>
        <label className='label' name="password">Password</label>
        <input className='inp' type="password" placeholder="Password" id="password" onChange={(e)=>{setPassword(e.target.value)}}/>
        <button className='loginbtn'>Sign Up</button>
        <p className='signuplogin'>Already have an account? <Link to="/login">Login</Link> </p>
        {/* <div className="social">
          <div className="go"><i className="fab fa-google"></i>  Google</div>
          <div className="fb"><i className="fab fa-facebook"></i>  Facebook</div>
        </div> */}
    </form>
    </div>
  )
}

export default SignUp