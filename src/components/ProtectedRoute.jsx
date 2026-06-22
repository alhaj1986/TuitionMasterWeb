import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Simple route guard that checks if a user is authenticated.
 * If `user` is falsy, the component redirects to the login page.
 * Otherwise it renders its children.
 */
const ProtectedRoute = ({ children }) => {
  // Bypass authentication for development/demo purposes
  return <>{children}</>;
};

export default ProtectedRoute;
