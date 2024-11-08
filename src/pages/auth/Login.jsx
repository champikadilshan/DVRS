// src/pages/auth/Login.jsx
import React from 'react';
import AWSAuthForm from '../../components/auth/AWSAuthForm';

const Login = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your AWS Account
        </h2>
      </div>
      <AWSAuthForm />
    </div>
  );
};

export default Login;
