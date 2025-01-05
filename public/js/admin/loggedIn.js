async function checkLoginStatus() {
    try {
        const response = await fetch('/admin/is-logged-in');
        const data = await response.json();

        // Change button text if logged in
        if (data.loggedIn) {
            const loginButton = document.getElementById('loginButton');
            loginButton.href = '/admin/logout';
            loginButton.innerText = 'Logout';
        }
    } catch (error) {
        console.error('Error checking login status:', error);
    }
}

// Call the function on page load
checkLoginStatus();