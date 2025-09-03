import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './SignUp.css';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatar, setAvatar] = useState(null);

  const handleImageChange = (e) => {
    setAvatar(e.target.files[0]);
  };

  const signup = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('avatar', avatar);

    try {
      const response = await axios.post('http://localhost:9000/signup', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.status === 200) {
        alert('Registration Successful');
      } else {
        alert('Registration Failed');
      }
    } catch (error) {
      console.error('There was an error!', error);
    }
  };

  return (
    <div className="loginWrap">
      <div className="background">
        <div className="shape"></div>
        <div className="shape"></div>
      </div>
      <form className="signupform" onSubmit={signup}>
        <h3>SignUp Here</h3>
        <label className="label" htmlFor="first_name">First Name</label>
        <input className="inp" type="text" placeholder="First Name" id="first_name" onChange={(e) => setFirstName(e.target.value)} />

        <label className="label" htmlFor="last_name">Last Name</label>
        <input className="inp" type="text" placeholder="Last Name" id="last_name" onChange={(e) => setLastName(e.target.value)} />

        <label className="label" htmlFor="email">Email</label>
        <input className="inp" type="email" placeholder="Email" id="email" onChange={(e) => setEmail(e.target.value)} />

        <label className="label" htmlFor="password">Password</label>
        <input className="inp" type="password" placeholder="Password" id="password" onChange={(e) => setPassword(e.target.value)} />

        <label className="label" htmlFor="avatar">Avatar</label>
        <input className="inp" type="file" id="avatar" onChange={handleImageChange} />

        <button className="loginbtn">Sign Up</button>
        <p className="signuplogin">Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
};

export default SignUp;
