import React, { useEffect } from 'react'; 
import { useUser } from '@clerk/clerk-react';  
import { useNavigate } from 'react-router-dom';  
import { Link } from 'react-router-dom';  
function Home() {
  const { user } = useUser(); 
  const navigate = useNavigate();  
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]); 

  if (!user) {
    return (
      <div>
        <h1>Welcome to Home Page!</h1>
        <p>If you are not logged in, you can <Link to="/login">Log In</Link> or <Link to="/signup">Sign Up</Link>.</p>
      </div>
    );
  }

  return null;  
}

export default Home;
