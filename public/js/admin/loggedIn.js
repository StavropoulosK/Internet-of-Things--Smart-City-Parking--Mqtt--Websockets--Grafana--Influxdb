async function checkLoginStatus() {
    try {
        const response = await fetch('/admin/is-logged-in');
        const data = await response.json();
        
        console.log('response:', data.loggedIn);

        // Change button text if logged in
        if (data.loggedIn) {
            const loginButton = document.getElementById('login-button');
            loginButton.href = '/admin/logout';
            loginButton.innerText = 'Logout';

            const dashboards = document.getElementById('dashboards');
            dashboards.style.display = 'block';
        } else {
            const dashboards = document.getElementById('dashboards');
            dashboards.style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking login status:', error);
    }
}

// Call the function on page load
checkLoginStatus();