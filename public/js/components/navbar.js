// Navbar functionality — mobile menu + scroll effect
(function() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuBackdrop = document.getElementById('mobileMenuBackdrop');
  const navbar = document.getElementById('navbar');

  if (!mobileMenuBtn || !mobileMenu || !navbar) return;

  const mobileMenuClose = mobileMenu.querySelector('.mobile-menu-close');
  if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeMenu);

  function openMenu() {
    mobileMenu.classList.add('open');
    mobileMenuBtn.classList.add('open');
    if (mobileMenuBackdrop) mobileMenuBackdrop.classList.add('open');
    mobileMenuBtn.setAttribute('aria-expanded', 'true');
    mobileMenuBtn.setAttribute('aria-label', 'Close menu');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileMenu.classList.remove('open');
    mobileMenuBtn.classList.remove('open');
    if (mobileMenuBackdrop) mobileMenuBackdrop.classList.remove('open');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    mobileMenuBtn.setAttribute('aria-label', 'Toggle menu');
    document.body.style.overflow = '';
  }

  mobileMenuBtn.addEventListener('click', () => {
    if (mobileMenu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (mobileMenuBackdrop) {
    mobileMenuBackdrop.addEventListener('click', closeMenu);
  }

  // Delegated: close the menu whenever any link inside it is clicked
  // (links are rendered dynamically after config loads).
  mobileMenu.addEventListener('click', function(e) {
    if (e.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      closeMenu();
      mobileMenuBtn.focus();
    }
  });

  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && mobileMenu.classList.contains('open')) {
      closeMenu();
    }
  });

  var touchStartX = 0;
  var touchCurrentX = 0;
  var touching = false;

  mobileMenu.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchCurrentX = touchStartX;
      touching = true;
      mobileMenu.style.transition = 'none';
    }
  }, { passive: true });

  mobileMenu.addEventListener('touchmove', function(e) {
    if (!touching) return;
    touchCurrentX = e.touches[0].clientX;
    var delta = Math.max(0, touchCurrentX - touchStartX);
    if (delta > 0) {
      mobileMenu.style.transform = 'translateX(' + delta + 'px)';
      if (mobileMenuBackdrop) {
        var progress = 1 - (delta / mobileMenu.offsetWidth);
        mobileMenuBackdrop.style.opacity = Math.max(0, progress);
      }
    }
  }, { passive: true });

  mobileMenu.addEventListener('touchend', function() {
    if (!touching) return;
    touching = false;
    mobileMenu.style.transition = '';
    var delta = touchCurrentX - touchStartX;
    if (delta > 80) {
      closeMenu();
    } else {
      mobileMenu.style.transform = '';
      if (mobileMenuBackdrop) mobileMenuBackdrop.style.opacity = '';
    }
  });
})();
