/**
 * Authentication (Login/Signup)
 */
const handleAuth = async (e, type) => {
  e.preventDefault(); 
  
  const fullnameElement = document.getElementById('fullname');
  const fullname = fullnameElement ? fullnameElement.value : ''; 
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  console.log(`Attempting ${type} for: ${username}`);

  try {
    const response = await fetch(`http://localhost:3000/${type.toLowerCase()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname, username, password })
    });

    const rawData = await response.text();
    let result;

    try {
        result = JSON.parse(rawData);
    } catch (parseError) {
        result = { message: rawData };
    }
    
    if (response.ok) {
      if (type.toLowerCase() === 'login') {
        alert(result.message || "Login successful!");
        
        if (result.user) {
            localStorage.setItem('userName', result.user.fullname);
            localStorage.setItem('userEmail', result.user.email);
            console.log("Data saved to localStorage.");
            
            // Redirect to dashboard
            window.location.assign('dashboard.html'); 
        }
      } else {
        alert(result.message || "Signup successful!");
        window.location.href = 'login.html';
      }
    } else {
      alert(`${type} failed: ${result.message || rawData}`);
    }

  } catch (error) {
    console.error(`${type} System Error:`, error);
    alert(`System error. Is your Node.js server running on port 3000?`);
  }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('signup-form')?.addEventListener('submit', (e) => handleAuth(e, 'Signup'));
    document.getElementById('login-form')?.addEventListener('submit', (e) => handleAuth(e, 'Login'));
});