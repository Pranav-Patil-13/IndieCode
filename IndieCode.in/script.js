const header = document.querySelector(".site-header");
const hero = document.querySelector(".hero");
const heroMedia = document.querySelector(".hero-media");
const heroVisual = document.querySelector(".hero-visual");
const anchorLinks = document.querySelectorAll('a[href^="#"]');

// ==========================================================================
// SPA: VIEW TOGGLING & SESSION MANAGEMENT
// ==========================================================================

const homeView = document.getElementById('home-view');
const dashboardView = document.getElementById('dashboard-view');
const headerCta = document.getElementById('header-cta');
const userProfileNav = document.getElementById('user-profile-nav');

window.toggleDashboard = (subview = null) => {
    // If we are currently on home, switch to dashboard
    const isShowingDashboard = dashboardView.style.display !== 'none';
    
    if (isShowingDashboard && !subview) {
        // Switch back to home
        dashboardView.style.display = 'none';
        homeView.style.display = 'block';
        window.scrollTo(0,0);
    } else {
        // Switch to dashboard
        homeView.style.display = 'none';
        dashboardView.style.display = 'block';
        window.scrollTo(0,0);
    }
    
    // Refresh Scroll Trigger for smooth performance
    if (window.lenis) window.lenis.scrollTo(0, { immediate: true });
};

window.handleLogout = async () => {
    if (window.supabaseClient) {
        await window.supabaseClient.auth.signOut();
        window.location.reload(); // Refresh to clean state
    }
};

const handleInitialAuth = async () => {
    // 1. Check if we just landed here from a Magic Link (#access_token=...)
    if (window.location.hash.includes('access_token=') && window.supabaseClient) {
        console.log("Magic Link detected. Finalizing login...");
        // Stay on page, but we'll let Supabase process the hash automatically
    }

    // 2. Check session
    if (window.supabaseClient) {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        
        if (session) {
            const user = session.user;
            const initials = user.email.substring(0, 1).toUpperCase();
            
            // UI Updates
            if (headerCta) headerCta.style.display = 'none';
            if (userProfileNav) userProfileNav.style.display = 'flex';
            
            // Hide all redundant text Dashboard / Portal links (header/footer)
            const redundantLinks = document.querySelectorAll('a[href="login.html"], .nav-portal-link');
            redundantLinks.forEach(link => {
                link.style.display = 'none'; // Cleaner look: hide them entirely
            });

            if (document.getElementById('user-initials')) document.getElementById('user-initials').innerText = initials;
            if (document.getElementById('user-email-display')) document.getElementById('user-email-display').innerText = user.email;
            
            const rawName = user.email.split('@')[0];
            const cleanName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
            if (document.getElementById('dash-user-name')) document.getElementById('dash-user-name').innerText = cleanName;

            // 3. Clear the URL hash if logged in via Magic Link
            if (window.location.hash.includes('access_token')) {
                window.toggleDashboard();
                setTimeout(() => {
                    history.replaceState(null, null, ' ');
                }, 100);
            }
        }
    }
};

// Run auth check immediately
handleInitialAuth();

let lenis = null;
let heroHeight = 0;

// 1. Performance: Cache Hero dimensions
const cacheHero = () => {
  if (hero) heroHeight = hero.offsetHeight;
};

// 2. Initial Setup
window.requestAnimationFrame(() => {
  document.body.classList.add("is-ready");
  cacheHero();
});

// 3. Optimized Parallax (Off-screen check)
let headerIsScrolled = false;
let isHeroInView = true;

const heroObserver = new IntersectionObserver((entries) => {
  isHeroInView = entries[0].isIntersecting;
}, { threshold: 0 });

if (hero) heroObserver.observe(hero);

const updateHeroParallax = (scrollY = window.scrollY) => {
  if (!hero || !isHeroInView || heroHeight === 0) return;
  
  const progress = Math.min(scrollY / heroHeight, 1);
  const translateY = scrollY * 0.22;
  const scale = 1.08 + progress * 0.04;
  const visualOffset = scrollY * 0.12;

  heroMedia.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
  heroVisual.style.transform = `translate3d(0, ${visualOffset}px, 0)`;

  const shouldBeScrolled = scrollY > 18;
  if (headerIsScrolled !== shouldBeScrolled) {
    header.classList.toggle("is-scrolled", shouldBeScrolled);
    headerIsScrolled = shouldBeScrolled;
  }
};

let ticking = false;
const onScroll = () => {
  if (lenis || ticking) return;
  window.requestAnimationFrame(() => {
    const scrollY = window.scrollY;
    updateHeroParallax(scrollY);
    ticking = false;
  });
  ticking = true;
};

window.addEventListener("scroll", onScroll, { passive: true });

// 4. Smooth Scroll (Lenis Optimized - Disabled on Mobile)
const isMobile = window.innerWidth <= 900 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (window.Lenis && !isMobile) {
  lenis = new window.Lenis({
    duration: 0.9,
    smoothWheel: true,
    smoothTouch: false,
    wheelMultiplier: 1,
    touchMultiplier: 1.5,
  });

  lenis.on("scroll", ({ animatedScroll }) => {
    updateHeroParallax(animatedScroll);
  });

  const raf = (time) => {
    lenis.raf(time);
    window.requestAnimationFrame(raf);
  };
  window.requestAnimationFrame(raf);

  anchorLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;
      
      const targetElement = document.querySelector(href);
      
      // SPA VIEW AWARENESS
      const isShowingDashboard = dashboardView && dashboardView.style.display !== 'none';
      if (isShowingDashboard) {
        event.preventDefault();
        window.toggleDashboard(); // Exit dashboard mode
        
        // Wait for Home View to render so ID exists
        setTimeout(() => {
          const freshTarget = document.querySelector(href);
          if (freshTarget && lenis) {
            lenis.scrollTo(freshTarget, { offset: -88, duration: 1.05 });
          }
        }, 50);
        return;
      }

      if (!targetElement) return;
      event.preventDefault();
      lenis.scrollTo(targetElement, { offset: -88, duration: 1.05 });
    });
  });

  // Logo Home Toggler
  const logo = document.querySelector('.brand');
  if (logo) {
    logo.addEventListener('click', (e) => {
        const isShowingDashboard = dashboardView && dashboardView.style.display !== 'none';
        if (isShowingDashboard) {
            e.preventDefault();
            window.toggleDashboard();
        }
    });
  }
}

// 5. Global Reveal Observer
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("reveal-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { 
    threshold: 0.12,
    rootMargin: "0px 0px -40px 0px"
  });

  document.querySelectorAll(".reveal-on-scroll").forEach((el) => {
    revealObserver.observe(el);
  });
}

// 6. Dynamic Footer Reveal Calculation
const updateFooterReveal = () => {
  const footer = document.querySelector(".site-footer");
  const main = document.querySelector("main");
  if (footer && main) {
    const height = footer.offsetHeight;
    main.style.marginBottom = `${height}px`;
  }
};

window.addEventListener("resize", () => {
  cacheHero();
  updateHeroParallax();
  updateFooterReveal();
});

// Initial runs
window.addEventListener("load", () => {
  updateFooterReveal();
});

updateFooterReveal();

// 7. Navigation Active State Observer
const navLinksElements = document.querySelectorAll('.site-nav a[href^="#"]');
const navObserverOptions = {
  root: null,
  rootMargin: '-20% 0px -40% 0px',
  threshold: 0
};

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinksElements.forEach(link => {
        if (link.getAttribute('href') === `#${id}`) {
          link.classList.add('is-active');
        } else {
          link.classList.remove('is-active');
        }
      });
    }
  });
}, navObserverOptions);

navLinksElements.forEach(link => {
  const targetId = link.getAttribute('href');
  if (targetId && targetId !== '#') {
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      navObserver.observe(targetElement);
    }
  }
});

if (hero) {
  const homeObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      navLinksElements.forEach(link => link.classList.remove('is-active'));
    }
  }, { rootMargin: '-20% 0px -40% 0px', threshold: 0 });
  homeObserver.observe(hero);
}

// ==========================================================================
// 3D CUBE METHODOLOGY LOGIC (EXPERIMENTAL)
// ==========================================================================

const initCubeSection = () => {
    const wrapper = document.getElementById('cube-methodology');
    const cube = document.getElementById('cube');
    const hudPct = document.getElementById('cube-hud-pct');
    const progFill = document.getElementById('cube-prog-fill');
    const sceneName = document.getElementById('cube-scene-name');
    const slides = document.querySelectorAll('.cube-slide');
    const textCards = document.querySelectorAll('.cube-text-card');

    if (!wrapper || !cube) return;

    const FACE_NAMES = [
        "STRATEGY",
        "DESIGN",
        "BUILD",
        "LAUNCH",
        "SCALE",
        "GENESIS"
    ];

    const STOPS = [
        { rx: 90, ry: 0 },
        { rx: 0, ry: 0 },
        { rx: 0, ry: -90 },
        { rx: 0, ry: -180 },
        { rx: 0, ry: -270 },
        { rx: -90, ry: -360 }
    ];

    const N = STOPS.length;
    const easeIO = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

    let lastIdx = -1;

    const animate = () => {
        const rect = wrapper.getBoundingClientRect();
        const winH = window.innerHeight;
        
        // Calculate progress through the whole section
        let progress = -rect.top / (rect.height - winH);
        
        // GENTLE ENTRANCE: If the section is entering from bottom, 
        // force progress 0 and shift it side-by-side immediately.
        const isEnteringFromBottom = rect.top > 0 && rect.top < winH;
        if (isEnteringFromBottom) {
            progress = 0;
        }

        progress = Math.max(0, Math.min(1, progress));

        const isActive = rect.top <= 0 && rect.bottom >= winH;
        wrapper.classList.toggle('is-active', isActive);

        // Update Cube Rotation
        const t = progress * (N - 1);
        const i = Math.min(Math.floor(t), N - 2);
        const f = easeIO(t - i);
        
        const a = STOPS[i];
        const b = STOPS[i+1];
        
        const rx = a.rx + (b.rx - a.rx) * f;
        const ry = a.ry + (b.ry - a.ry) * f;

        cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;

        // 1. Dynamic Cube Positioning (Side-by-side)
        const si = Math.min(N - 1, Math.floor(progress * N));
        // Force shift to right (Phase 1) if progress is near 0
        const shiftX = (si % 2 === 0) ? '18vw' : '-18vw';
        
        // Stabilize for desktop, center for mobile
        const scene = document.getElementById('cube-scene');
        if (scene && window.innerWidth > 900) {
            scene.style.transform = `translateX(${shiftX})`;
            scene.style.opacity = '1';
        } else if (scene) {
            scene.style.transform = `none`;
        }

        // 2. Update HUD & Text Cards
        const p = Math.round(progress * 100);

        if (hudPct) hudPct.textContent = String(p).padStart(3, '0') + "%";
        if (progFill) progFill.style.width = `${p}%`;

        if (si !== lastIdx) {
            lastIdx = si;
            if (sceneName) sceneName.textContent = FACE_NAMES[si];
        }

        // 3. Handle text card visibility manually
        textCards.forEach((card, idx) => {
            const cardRect = card.getBoundingClientRect();
            
            // SPECIAL: Phase 1 (Intro) card is explicitly ON as long as section is even partially visible
            // AND we haven't scrolled deep into phase 2 yet.
            let isVisible = false;
            if (idx === 0 && rect.top < winH * 0.95 && rect.top > -winH * 0.4) {
                isVisible = true;
            } else {
                isVisible = cardRect.top < winH * 0.75 && cardRect.bottom > winH * 0.15;
            }
            if (isVisible) {
                card.classList.add('visible');
            } else {
                card.classList.remove('visible');
            }
        });

        requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
};

// Initial run
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCubeSection);
} else {
    initCubeSection();
}

// ==========================================================================
// ZERO-REDIRECT PORTAL LOGIC
// ==========================================================================

const contactForm = document.getElementById('contact-form');
const successModal = document.getElementById('success-modal');
const modalEmailDisplay = document.getElementById('modal-email-display');

window.closeModal = () => {
    if (successModal) successModal.classList.remove('is-active');
};

if (contactForm) {
    // ALWAYS attach the listener immediately so we can block the page reload (?) refresh behavior.
    // Even if Supabase is still loading, we MUST preventDefault.
    contactForm.onsubmit = async (e) => {
        e.preventDefault();
        
        // Log to console so you can see if something is blocking initialization
        console.log("Inquiry Form Submitted. Zero-Redirect Active.");

        const submitBtn = document.getElementById('submit-btn');
        const submitBtnText = submitBtn ? submitBtn.querySelector('span') : null;

        // Check if initialization was successful
        if (!window.supabaseClient) {
            console.error("Supabase Client missing at submission time.");
            alert("Database Connection Error. Please refresh the page and try again.");
            return;
        }

        // UI Loading
        submitBtn.disabled = true;
        submitBtn.classList.add('is-loading');
        if (submitBtnText) submitBtnText.textContent = 'Syncing...';

        const formData = new FormData(contactForm);
        const email = formData.get('email');
        const name = formData.get('name');
        const countryCode = formData.get('country_code');
        const phone = formData.get('phone');
        const interest = formData.get('interest');
        const message = formData.get('message');

        // Generate Password (e.g., "pranav@123")
        const firstName = name.trim().split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
        let generatedPassword = firstName + "@123";
        // Ensure min length (Supabase requires 6+)
        if (generatedPassword.length < 6) {
            generatedPassword = (firstName + "code").slice(0, 5) + "@123"; 
        }

        try {
            // 1. SAVE INQUIRY FIRST (Priority - Database)
            const { error: dbError } = await window.supabaseClient
                .from('inquiries')
                .insert([
                    { 
                        name, 
                        email, 
                        phone: `${countryCode} ${phone}`,
                        interest, 
                        message 
                    }
                ]);

            if (dbError) {
                console.warn("DB Insert failed: Table 'inquiries' probably not created yet or RLS blocked it.", dbError);
            }

            // 2. SEND NOTIFICATION EMAIL (Background - Web3Forms)
            try {
                const web3formData = new FormData(contactForm);
                // Combine credentials for YOU in the notification
                web3formData.append('Assigned Login ID', email);
                web3formData.append('Auto Password', generatedPassword);
                web3formData.append('Full Phone', `${countryCode} ${phone}`);
                
                fetch("https://api.web3forms.com/submit", {
                    method: "POST",
                    body: web3formData
                }).then(res => res.json())
                  .then(data => console.log("Web3Forms Response:", data))
                  .catch(e => console.error("Web3Forms Relay Error:", e));
            } catch (emailErr) {
                console.warn("Notification Email Relay failed, but lead saved to DB.", emailErr);
            }

            // 3. TRIGGER ACCOUNT CREATION (Password based)
            let isNewAccount = false;
            const { data: { session: currentSession } } = await window.supabaseClient.auth.getSession();
            
            if (!currentSession || currentSession.user.email !== email) {
                // Try to Sign Up (Create Account)
                const { data: signUpData, error: signUpError } = await window.supabaseClient.auth.signUp({
                    email: email,
                    password: generatedPassword,
                    options: {
                        data: { full_name: name }
                    }
                });
                
                // If it fails because user already exists, we just move on (they can just login)
                if (!signUpError) {
                    isNewAccount = true;
                }
            }

            // 4. Update Modal Dynamically
            const titleEl = document.getElementById('modal-title');
            const descEl = document.getElementById('modal-description');
            const statusEl = document.getElementById('modal-status-text');
            const badgeEl = document.getElementById('modal-badge-status');
            const emailLabel = document.getElementById('sent-email-label');
            if (emailLabel) emailLabel.innerText = email;

            if (isNewAccount) {
                if (titleEl) titleEl.innerText = "Access Secured";
                if (descEl) descEl.innerHTML = "Your inquiry is received and private account initialized! Check your **email inbox** for your login credentials and portal access.";
                if (statusEl) statusEl.innerHTML = "Profile established for <strong>" + email + "</strong>";
                if (badgeEl) badgeEl.innerText = "Secure Onboarding";
            } else {
                // Return User
                if (titleEl) titleEl.innerText = "Welcome Back";
                if (descEl) descEl.innerHTML = "Your inquiry has been **linked** to your active profile. Check your email for confirmation.";
                if (statusEl) statusEl.innerHTML = "Lead synced to <strong>" + email + "</strong>";
                if (badgeEl) badgeEl.innerText = "Lead Synced";
            }

            if (modalEmailDisplay) modalEmailDisplay.innerText = email;
            if (successModal) successModal.classList.add('is-active');
            contactForm.reset();

        } catch (err) {
            console.error(err);
            alert("Inquiry Error: " + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('is-loading');
            if (submitBtnText) submitBtnText.textContent = 'Send Message';
        }
    };
}

// ==========================================================================
// LOGIN FORM HANDLER (login.html)
// ==========================================================================
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const statusEl = document.getElementById('auth-status');
        const submitBtn = document.getElementById('auth-submit-btn');

        if (!window.supabaseClient) return;

        submitBtn.disabled = true;
        submitBtn.classList.add('is-loading');

        try {
            const { error } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // Success -> Redirect to index.html with fragment to trigger dashboard view
            window.location.href = 'index.html#dashboard';
        } catch (err) {
            if (statusEl) {
                statusEl.innerText = "Error: " + err.message;
                statusEl.style.color = "#ff4444";
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('is-loading');
        }
    };
}
