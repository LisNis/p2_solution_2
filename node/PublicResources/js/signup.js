document.addEventListener('DOMContentLoaded', () => {
    const signupBtn = document.getElementById('signup-btn');
    const loginBtn = document.getElementById('login-btn');
    const usernameSignup = document.getElementById("user-name");
    const passwordSignup = document.getElementById("password");
    const passwordRepeat = document.getElementById("passwordRepeat");

    signupBtn.addEventListener("click", async function() {
        const username = usernameSignup.value.trim();
        const password = passwordSignup.value;
        const repeatPassword = passwordRepeat.value;

        // Needs username, password, and repeat password
        if (!username || !password || !repeatPassword) {
            alert("Please enter your username, password, and repeat password.");
            return;
        }

        // password and repeat password match
        if (password !== repeatPassword) {
            alert("Passwords do not match.");
            return;
        }

        // at least 4 char long
        if (password.length < 4) {
            alert("Password must be at least 4 characters long.");
            return;
        }

        if (username.length > 15) {
            alert("Username is too long.");
            return;
        }

        try {
            // Check if the username already exists
            const response = await fetch(`/check-username?username=${encodeURIComponent(username)}`);
            const data = await response.json();

            if (!data.available) {
                alert("Username already exists. Please choose a different username.");
                return;
            }

            // Send signup request to server
            const signupResponse = await fetch('/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (signupResponse.ok) {
                // Signup successful,
                localStorage.setItem("username", username);
                window.location.href = "/groups";
            } else {
                // Signup failed, display error message
                const errorMessage = await signupResponse.text();
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Error during signup:', error);
            alert('An error occurred during signup. Please try again later.');
        }
    });

    loginBtn.addEventListener("click", function() {
        window.location.href = "/login";
    });
});

