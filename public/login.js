document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorBox = document.getElementById("loginError");

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Invalid username or password.");
    }

    localStorage.setItem("user", JSON.stringify(result)); // Store user information
    window.location.href = result.redirect; // Use redirect URL from server

  } catch (err) {
    errorBox.textContent = err.message || "An error occurred.";
  }
});