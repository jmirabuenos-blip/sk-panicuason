/* ============================================
   SK BARANGAY PANICUASON — admin-auth.js
   Authentication helpers for the admin panel.
   Depends on firebase-config.js being loaded first.
============================================ */

const AdminAuth = (() => {

  /**
   * Sign in with email and password.
   * @returns {Promise<firebase.auth.UserCredential>}
   */
  function signIn(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
  }

  /**
   * Sign out the current user.
   * @returns {Promise<void>}
   */
  function signOut() {
    return auth.signOut();
  }

  /**
   * Get the currently authenticated user (or null).
   * @returns {firebase.User|null}
   */
  function getCurrentUser() {
    return auth.currentUser;
  }

  /**
   * Listen for auth state changes.
   * @param {function(firebase.User|null)} callback
   * @returns {function} Unsubscribe function
   */
  function onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
  }

  /**
   * Protect a page — redirect to login if not authenticated.
   * Call this at the top of any admin page.
   * @param {string} loginUrl  — path to the login page (default: 'login.html')
   */
  function protectPage(loginUrl) {
    loginUrl = loginUrl || 'login.html';
    return new Promise((resolve) => {
      const unsub = auth.onAuthStateChanged((user) => {
        unsub();
        if (!user) {
          window.location.href = loginUrl;
        } else {
          resolve(user);
        }
      });
    });
  }

  /**
   * Simple role check via Firestore users collection.
   * Expects a document at users/{uid} with { role: 'admin' }.
   * @returns {Promise<boolean>}
   */
  async function isAdmin() {
    const user = auth.currentUser;
    if (!user) return false;
    try {
      const doc = await db.collection('users').doc(user.uid).get();
      return doc.exists && doc.data().role === 'admin';
    } catch {
      return false;
    }
  }

  return { signIn, signOut, getCurrentUser, onAuthStateChanged, protectPage, isAdmin };
})();
