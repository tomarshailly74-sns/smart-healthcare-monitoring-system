
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCQGY5x02x8pfMu05RSS_VbVW9iCKFgnYs",
    authDomain: "smarthealthcare-1faaf.firebaseapp.com",
    projectId: "smarthealthcare-1faaf",
    storageBucket: "smarthealthcare-1faaf.firebasestorage.app",
    messagingSenderId: "183240494760",
    appId: "1:183240494760:web:07a9ff1f0b8ec5d2a87c9d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const emailInput = document.getElementById("doctorEmail");
const passwordInput = document.getElementById("doctorPassword");
const loginButton = document.getElementById("doctorLoginBtn");
const loginStatus = document.getElementById("loginStatus");

loginButton.addEventListener("click", async function () {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (email === "" || password === "") {
        loginStatus.textContent = "Please enter your email and password.";
        return;
    }

    loginButton.disabled = true;
    loginStatus.textContent = "Logging in...";

    try {
        await signInWithEmailAndPassword(auth, email, password);

        window.location.href = "doctor-dashboard.html";

    } catch (error) {
        console.error("Doctor login error:", error);

        loginStatus.textContent =
            "Login failed. Please check your email and password.";

        loginButton.disabled = false;
    }
});
