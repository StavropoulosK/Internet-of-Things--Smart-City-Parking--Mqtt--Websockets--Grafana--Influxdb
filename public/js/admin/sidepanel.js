async function checkLoginStatus() {
    try {
        const response = await fetch('/admin/is-logged-in');
        const data = await response.json();
        
        console.log('response:', data.loggedIn);

        // Change button text if logged in
        if (data.loggedIn) {
            const loginButton = document.getElementsByClassName('login-button')[0];

            loginButton.href = '/admin/logout';
            loginButton.innerHTML= '<i class="fa-solid fa-arrow-right-from-bracket"></i><div class="tooltip">Logout</div>';

            const dashboardButton = document.getElementsByClassName('dashboards')[0];
            dashboardButton.classList.remove('hidden');
        } else {
            const dashboardButton = document.getElementsByClassName('dashboards')[0];
            dashboardButton.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error checking login status:', error);
    }
}


function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('open');
}

function showInfo() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle("show-tooltips");
}

// Call the function on page load
checkLoginStatus();