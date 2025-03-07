import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBP9LKEycWqwnGG5vQRnqZ7ThAQrPf1jK0",
    authDomain: "oxford-ansar.firebaseapp.com",
    projectId: "oxford-ansar",
    storageBucket: "oxford-ansar.appspot.com",
    messagingSenderId: "1071189202434",
    appId: "1:1071189202434:web:6c512b0a7221ec7c36f91b",
    measurementId: "G-7YJCT2N8K7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };