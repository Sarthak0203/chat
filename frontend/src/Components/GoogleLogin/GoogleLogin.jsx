// GoogleLogin.js

import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';

const GoogleLogin = () => {
  const { signIn } = useGoogleLogin({
    client_id: '360378540154-f5igv128a2sapi00gt6olg3fgvvbjo6g.apps.googleusercontent.com', // Replace with your actual client ID
    onSuccess: (response) => {
      // Handle successful login (e.g., set tokens, redirect, etc.)
      console.log('Google login success:', response);
    },
    onFailure: (error) => {
      // Handle login failure
      console.error('Google login error:', error);
    },
  });

  return (
    <button onClick={signIn}>Login with Google</button>
  );
};

export default GoogleLogin;
