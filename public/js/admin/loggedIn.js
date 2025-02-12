async function checkLoginStatus() {
    try {
        const response = await fetch('/admin/is-logged-in');
        const data = await response.json();
        
        console.log('response:', data.loggedIn);

        // Change button text if logged in
        if (data.loggedIn) {
            const loginButtons = document.getElementsByClassName('login-button');

            // loginButton.href = '/admin/logout';
            // loginButton.innerHTML= '<i class="fa-solid fa-arrow-right-from-bracket"></i> Αποσύνδεση'

            Array.from(loginButtons).forEach((loginButton) => {
                loginButton.href = '/admin/logout';
                loginButton.innerHTML = '<i class="fa-solid fa-arrow-right-from-bracket"></i> Αποσύνδεση';
            });

            const dashboards = document.getElementsByClassName('dashboards');

            Array.from(dashboards).forEach((dashboard) => {
                dashboard.style.display = 'inline';

            });

            // dashboards.style.display = 'inline';
        } else {
            const dashboards = document.getElementsByClassName('dashboards');

            // dashboards.style.display = 'none';
            Array.from(dashboards).forEach((dashboard) => {
                dashboard.style.display = 'none';

            });

        }
    } catch (error) {
        console.error('Error checking login status:', error);
    }
}

function toggleDropdown() {
    const dropdown = document.querySelector('.dropdown');
    dropdown.classList.toggle('visible');
}

// Call the function on page load
checkLoginStatus();