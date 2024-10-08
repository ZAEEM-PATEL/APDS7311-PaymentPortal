import React, { useState } from 'react';
import './App.css';
import LoginSignup from './Components/LoginSignup/LoginSignup'; // Login & Signup Component
import Dashboard from './Components/Dashboard/Dashboard'; // Dashboard Component

function App() {
  // Track if the user is authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to handle successful login
  const handleLoginSuccess = () => {
    setIsAuthenticated(true); // Set the state to authenticated
  };

  return (
    <div className="App">
      {isAuthenticated ? (
        <Dashboard />  // Show dashboard if logged in
      ) : (
        <LoginSignup onLoginSuccess={handleLoginSuccess} />  // Show LoginSignup if not logged in
      )}
    </div>
  );
}

export default App;