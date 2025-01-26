document.getElementById("login-form").addEventListener("submit", async (event) => {
    console.log("Login form submitted");
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/admin/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        console.log("Response:", response);
        if (response.ok) {
            // Handle successful login (redirect, etc.)
            window.location.href = '/';  // Example redirect
        } else {
            // Show error message
            document.getElementById("error-popup").style.display = 'block';
        }
    })
    .catch(error => {
        console.error("Error during login:", error);
        document.getElementById("error-popup").style.display = 'block';
    });
});