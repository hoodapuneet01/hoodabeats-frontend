const API_URL = "https://hoodabeats-backend.onrender.com";

const form = document.getElementById("loginForm");
const message = document.getElementById("loginMessage");

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value;

    message.textContent = "Logging in...";

    try {
        const response = await fetch(
            API_URL + "/admin-login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.token) {
            throw new Error(
                data.message || "Login failed"
            );
        }

        localStorage.setItem(
            "hoodabeats_admin_token",
            data.token
        );

        message.textContent =
            "Login successful. Opening admin panel...";

        window.location.replace("admin.html");

    } catch (error) {
        console.error(error);

        message.textContent =
            "❌ " + error.message;
    }
});