import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import React from 'react';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen  text-center">
      <AlertTriangle size={80} className="text-red-500 mb-4" />
      <h1 className="text-4xl font-bold text-gray-800">404 - Page Not Found</h1>
      <p className="text-gray-600 text-lg mt-2">Oops! The page you’re looking for doesn’t exist.</p>
      <Link to="/" className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-all">
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFound;
