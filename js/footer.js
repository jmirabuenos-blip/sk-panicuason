/* ============================================
   SK BARANGAY PANICUASON — footer.js
   Shared footer component.
   Drop <div id="sk-footer"></div> before the
   closing </body> tag on every page, then load
   this script.
============================================ */

(function () {

  const currentYear = new Date().getFullYear();

  const footerHTML = `
    <footer class="footer">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="index.html" class="nav-logo">
            <img src="images/logo.jpg" alt="SK seal" />
            <div class="nav-logo-text">
              <span class="top">Sangguniang Kabataan</span>
              <span class="sub">Barangay Panicuason · Naga City</span>
            </div>
          </a>
          <p>Serving the youth with integrity, passion, and purpose. Together, we build a stronger Barangay Panicuason.</p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul class="footer-links">
            <li><a href="index.html">Home</a></li>
            <li><a href="about.html">About</a></li>
            <li><a href="council.html">Council</a></li>
            <li><a href="programs.html">Programs</a></li>
            <li><a href="events.html">Events</a></li>
            <li><a href="gallery.html">Gallery</a></li>
            <li><a href="budget.html">Budget</a></li>
            <li><a href="contact.html">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul class="footer-contact">
            <li><span>📍</span> Barangay Panicuason Hall, Naga City</li>
            <li><span>📞</span> (123) 456-7890</li>
            <li><span>✉️</span> <a href="https://mail.google.com/mail/?view=cm&to=skpanicuason@gmail.com" target="_blank">skpanicuason@gmail.com</a></li>
            <li><span>🕗</span> Mon–Fri, 8AM–5PM</li>
            <li><span>📘</span> <a href="https://www.facebook.com/skpanicuason2023" target="_blank">facebook.com/skpanicuason2023</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${currentYear} Sangguniang Kabataan Barangay Panicuason. All rights reserved.</span>
        <span>Built with 💛 for the Youth of Naga City</span>
      </div>
    </footer>
  `;

  const mount = document.getElementById('sk-footer');
  if (mount) {
    mount.insertAdjacentHTML('afterend', footerHTML);
    mount.remove();
  } else {
    document.body.insertAdjacentHTML('beforeend', footerHTML);
  }

})();