/* ============================================
   SK BARANGAY PANICUASON — firebase-config.js
   Firebase SDK initialization (Compat mode)
   Replace the config object below with your
   own Firebase project credentials.
============================================ */

// Firebase SDK via CDN (loaded in HTML before this script)
// <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-storage-compat.js"></script>

const firebaseConfig = {
  apiKey:            "AIzaSyD1YL3YQiMVAUHTYWJvgY0e_h6rlh1x5jM",
  authDomain:        "sk-websote.firebaseapp.com",
  projectId:         "sk-websote",
  storageBucket:     "sk-websote.firebasestorage.app",
  messagingSenderId: "424356787039",
  appId:             "1:424356787039:web:f85915c85ee15732733cea",
  measurementId:      "G-XDJNTTHFY2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Convenience references
const auth    = typeof firebase.auth === 'function' ? firebase.auth() : null;
const db      = firebase.firestore();
const storage = typeof firebase.storage === 'function' ? firebase.storage() : null;
