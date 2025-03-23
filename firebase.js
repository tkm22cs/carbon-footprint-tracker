// Firebase Configuration (Replace with your actual Firebase keys)
const firebaseConfig = {
    apiKey: "AIzaSyDD7hOZQ7Ozilw_xaiwUos_6kwWk_-l0LA",
    authDomain: "cft-tracker.firebaseapp.com",
    projectId: "cft-tracker",
    storageBucket: "cft-tracker.firebasestorage.app",
    messagingSenderId: "840776541266",
    appId: "1:840776541266:web:ca99aadc9e5d795219eb8b"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize Firebase Services
const auth = firebase.auth();
const db = firebase.firestore();
