document.addEventListener("DOMContentLoaded", function () {
    if (!firebase.apps.length) {
        console.error("Firebase not initialized!");
        return;
    }

    console.log("✅ Firebase Initialized Successfully!");

    // Function to sign up users
    function signup() {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        auth.createUserWithEmailAndPassword(email, password)
            .then(() => {
                alert("User Registered!");
                window.location.href = "dashboard.html"; // Redirect to Dashboard
            })
            .catch((error) => {
                alert(error.message);
            });
    }

    // Function to log in users
    function login() {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                alert("Login Successful!");
                window.location.href = "dashboard.html";
            })
            .catch((error) => {
                alert(error.message);
            });
    }

    // ✅ Ensure buttons exist before attaching event listeners
    document.getElementById("signupBtn")?.addEventListener("click", signup);
    document.getElementById("loginBtn")?.addEventListener("click", login);
});
