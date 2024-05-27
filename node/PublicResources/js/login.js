const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const usernameLogin = document.getElementById("login-username");
const passwordLogin = document.getElementById("login-password");

    
    
async function handleLogin() {
    const username = usernameLogin.value.trim();
    const password = passwordLogin.value;

    // Need username and password
    if (!username || !password) {
        alert("Please enter your username and password.");
        return;
    }

    try {
        // Send login request to server
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            // Login successful 
            localStorage.setItem("username", username);
            window.location.href = "/groups"; 
        } else {
            // Login failed, display error message
            const errorMessage = await response.text();
            alert(errorMessage);
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred during login. Please try again later.');
    }
};

loginBtn.addEventListener("click", handleLogin);

    signupBtn.addEventListener("click", function() {
        window.location.href = "/signup";
    });
    
    // Event listener to allow login when pressing Enter key
    document.addEventListener("keydown", function(event) {
        if (event.key === "Enter" && (document.activeElement === usernameInput || document.activeElement === passwordInput)) {
            // If Enter key is pressed and focus is on username or password input fields, trigger login
            handleLogin();
        }
    });

    