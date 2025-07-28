// js/firebase_config.js

const firebaseConfig = {
    apiKey: "AIzaSyCGWYUBfXbgAZGcQ7e6V_Hfm_eyclkIaPQ",
    authDomain: "tabungan-2cb46.firebaseapp.com",
    databaseURL: "https://tabungan-2cb46-default-rtdb.firebaseio.com",
    projectId: "tabungan-2cb46",
    storageBucket: "tabungan-2cb46.firebasestorage.app",
    messagingSenderId: "114405147001",
    appId: "1:114405147001:web:a1ea3faa1f8cf0fd316fa8"
};

// Pastikan konfigurasi tidak kosong
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('AIzaSyCGWYUBfXbgAZGcQ7e6V_Hfm_eyclkIaPQ')) {
    console.error("Firebase configuration is missing or invalid. Please check js/firebase_config.js");
} else {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase app initialized successfully.");
}

const auth = firebase.auth();
const database = firebase.database();