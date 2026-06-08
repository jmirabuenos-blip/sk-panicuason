/* ============================================
    SK BARANGAY PANICUASON — nav.js
    Shared navigation component.
    Drop <div id="sk-nav"></div> at the top of
    <body> on every page, then load this script.
============================================ */

(function () {

  const NAV_LINKS = [
    {
      label: 'Home', href: 'index.html',
      dropdown: [
        { label: 'Home',                 href: 'index.html' },
        { label: 'History',              href: 'history.html' },
        { label: 'Barangay Demographics',href: 'demographics.html' },
      ]
    },
    { label: 'About',   href: 'about.html' },
    {
      label: 'Programs', href: 'programs.html',
      dropdown: [
        { label: 'Programs', href: 'programs.html' },
        { label: 'Events',   href: 'events.html' },
        { label: 'Gallery',  href: 'gallery.html' },
      ]
    },
    { label: 'Budget',      href: 'budget.html' },
    { label: 'Resolutions', href: 'resolutions.html' }, /* Added for the Chairman's request */
    { label: 'Contact',     href: 'contact.html' },
  ];

  /* ── Detect active page ── */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  /* ── Build nav links HTML ── */
  const linksHTML = NAV_LINKS.map(link => {
    if (link.dropdown) {
      /* Check if the active page is this item OR any of its children */
      const parentActive = currentPage === link.href;
      const childActive  = link.dropdown.some(d => d.href === currentPage);
      const activeClass  = (parentActive || childActive) ? ' active' : '';

      const dropItems = link.dropdown.map(d => {
        const dActive = currentPage === d.href ? ' class="active"' : '';
        return `<li><a href="${d.href}"${dActive}>${d.label}</a></li>`;
      }).join('');

      return `
        <li class="has-dropdown${activeClass}">
          <a href="${link.href}" class="dropdown-toggle">
            ${link.label}
            <svg class="arrow-icon" xmlns="http://www.w3.org/2000/svg"
                 width="12" height="12" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                 aria-hidden="true">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </a>
          <ul class="dropdown-menu">
            ${dropItems}
          </ul>
        </li>`;
    }

    const isActive = currentPage === link.href ? ' class="active"' : '';
    return `<li><a href="${link.href}"${isActive}>${link.label}</a></li>`;
  }).join('');

  /* ── Nav HTML ── */
  const navHTML = `
    <nav class="navbar" id="sk-navbar">
      <div class="nav-inner">
        <a href="index.html" class="nav-logo">
          <img src="images/logo.jpg" alt="SK Barangay Panicuason seal" />
          <div class="nav-logo-text">
            <span class="top">Sangguniang Kabataan</span>
            <span class="sub">Barangay Panicuason · Naga City</span>
          </div>
        </a>
        <ul class="nav-links" id="navLinks">
          ${linksHTML}
        </ul>
        <button class="nav-hamburger" id="hamburger"
                aria-label="Toggle menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  `;

  /* ── Inject ── */
  const mount = document.getElementById('sk-nav');
  if (mount) {
    mount.insertAdjacentHTML('afterend', navHTML);
    mount.remove();
  } else {
    document.body.insertAdjacentHTML('afterbegin', navHTML);
  }

  /* ── Hamburger toggle ── */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    /* Close menu when a non-dropdown link is clicked (mobile) */
    navLinks.querySelectorAll('a:not(.dropdown-toggle)').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── Dropdown: mobile toggle (click) + desktop hover ── */
  document.querySelectorAll('.has-dropdown').forEach(item => {
    const toggle = item.querySelector('.dropdown-toggle');

    /* On MOBILE — clicking the parent link toggles the sub-menu
       instead of navigating away                                   */
    toggle.addEventListener('click', function (e) {
      /* Only intercept on narrow screens */
      if (window.innerWidth <= 768) {
        e.preventDefault();
        item.classList.toggle('dropdown-open');
      }
    });
  });

  /* Close dropdowns when clicking outside */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.has-dropdown')) {
      document.querySelectorAll('.has-dropdown').forEach(el => {
        el.classList.remove('dropdown-open');
      });
    }
  });

  /* ── Scroll shadow ── */
  window.addEventListener('scroll', function () {
    const navbar = document.getElementById('sk-navbar');
    if (navbar) {
      navbar.style.boxShadow = window.scrollY > 10
        ? '0 2px 24px rgba(0,0,0,0.22)'
        : '';
    }
  });

})();