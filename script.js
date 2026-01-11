// ================================
// Modern, Frictionless UX Script
// ================================

(function() {
    'use strict';

    // ================================
    // Navigation
    // ================================
    const navbar = document.getElementById('navbar');
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Navbar scroll effect
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    // Mobile menu toggle
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });
    }

    // Close mobile menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                mobileToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Close mobile menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            mobileToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // ================================
    // Smooth Scroll
    // ================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');

            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const navHeight = navbar.offsetHeight;
                const targetPosition = targetElement.offsetTop - navHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ================================
    // Active Navigation Link
    // ================================
    const sections = document.querySelectorAll('section[id]');

    function highlightNavigation() {
        const scrollY = window.pageYOffset;

        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - navbar.offsetHeight - 100;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

            if (navLink) {
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    navLink.style.color = 'var(--color-primary)';
                } else {
                    navLink.style.color = '';
                }
            }
        });
    }

    window.addEventListener('scroll', highlightNavigation);
    highlightNavigation(); // Initial call

    // ================================
    // Intersection Observer for Animations
    // ================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Animate elements on scroll
    const animateElements = document.querySelectorAll(`
        .skill-card,
        .timeline-item,
        .about-card,
        .eligibility-card,
        .enrollment-feature
    `);

    animateElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(el);
    });

    // ================================
    // Form Placeholder Management
    // ================================
    const formIframe = document.querySelector('.enrollment-form iframe');
    const formPlaceholder = document.querySelector('.form-placeholder');

    if (formIframe && formPlaceholder) {
        // Check if iframe src is the default placeholder
        const iframeSrc = formIframe.getAttribute('src');
        if (iframeSrc && iframeSrc.includes('YOUR_FORM_ID')) {
            formPlaceholder.style.display = 'flex';
        } else {
            formPlaceholder.style.display = 'none';
        }

        // Hide placeholder when iframe loads
        formIframe.addEventListener('load', () => {
            const iframeSrc = formIframe.getAttribute('src');
            if (iframeSrc && !iframeSrc.includes('YOUR_FORM_ID')) {
                formPlaceholder.style.display = 'none';
            }
        });
    }

    // ================================
    // Stats Counter Animation
    // ================================
    function animateCounter(element, target, duration = 2000) {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    }

    // Trigger counter animation when stats come into view
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                const statValue = entry.target.querySelector('.stat-value');
                const targetValue = parseInt(statValue.textContent);

                if (!isNaN(targetValue)) {
                    animateCounter(statValue, targetValue);
                    entry.target.dataset.animated = 'true';
                }
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-item').forEach(stat => {
        statsObserver.observe(stat);
    });

    // ================================
    // Floating Cards Parallax Effect
    // ================================
    const floatingCards = document.querySelectorAll('.float-card');

    if (window.innerWidth > 768) {
        window.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = e.clientY / window.innerHeight;

            floatingCards.forEach((card, index) => {
                const speed = (index + 1) * 10;
                const x = (mouseX - 0.5) * speed;
                const y = (mouseY - 0.5) * speed;

                card.style.transform = `translate(${x}px, ${y}px)`;
            });
        });
    }

    // ================================
    // Keyboard Navigation
    // ================================
    document.addEventListener('keydown', (e) => {
        // Alt + H: Home
        if (e.altKey && e.key === 'h') {
            e.preventDefault();
            document.querySelector('#home').scrollIntoView({ behavior: 'smooth' });
        }

        // Alt + C: Curriculum
        if (e.altKey && e.key === 'c') {
            e.preventDefault();
            document.querySelector('#curriculum').scrollIntoView({ behavior: 'smooth' });
        }

        // Alt + E: Enroll
        if (e.altKey && e.key === 'e') {
            e.preventDefault();
            document.querySelector('#enroll').scrollIntoView({ behavior: 'smooth' });
        }
    });

    // ================================
    // Performance: Lazy Load Images
    // ================================
    if ('loading' in HTMLImageElement.prototype) {
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
            img.src = img.dataset.src;
        });
    } else {
        // Fallback for browsers that don't support lazy loading
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
        document.body.appendChild(script);
    }

    // ================================
    // Timeline Progress Indicator
    // ================================
    const timeline = document.querySelector('.timeline');
    const timelineItems = document.querySelectorAll('.timeline-item');

    if (timeline && timelineItems.length > 0) {
        const timelineObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.querySelector('.timeline-dot').style.borderColor = 'var(--color-accent)';
                    entry.target.querySelector('.timeline-dot').style.transform = 'scale(1.1)';
                    entry.target.querySelector('.timeline-dot').style.transition = 'all 0.3s ease';
                }
            });
        }, { threshold: 0.5 });

        timelineItems.forEach(item => {
            timelineObserver.observe(item);
        });
    }

    // ================================
    // Button Ripple Effect
    // ================================
    const buttons = document.querySelectorAll('.btn, .btn-primary, .btn-secondary, .btn-cta');

    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');

            this.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Add ripple styles
    const style = document.createElement('style');
    style.textContent = `
        .btn, .btn-primary, .btn-secondary, .btn-cta {
            position: relative;
            overflow: hidden;
        }
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            pointer-events: none;
        }
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // ================================
    // Preload Critical Resources
    // ================================
    window.addEventListener('load', () => {
        // Preload curriculum HTML
        const curriculumLink = document.querySelector('a[href*="curriculum.html"]');
        if (curriculumLink) {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = curriculumLink.getAttribute('href');
            document.head.appendChild(link);
        }
    });

    // ================================
    // Accessibility Improvements
    // ================================

    // Skip to main content
    const skipLink = document.createElement('a');
    skipLink.href = '#home';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 0;
        background: var(--color-primary);
        color: white;
        padding: 8px 16px;
        text-decoration: none;
        z-index: 10000;
        border-radius: 0 0 4px 0;
    `;
    skipLink.addEventListener('focus', () => {
        skipLink.style.top = '0';
    });
    skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
    });
    document.body.insertBefore(skipLink, document.body.firstChild);

    // ================================
    // Console Welcome Message
    // ================================
    console.log(
        '%cWelcome to NamastAI.shiksha! 🙏',
        'font-size: 24px; font-weight: bold; color: #2563eb;'
    );
    console.log(
        '%cBuilt with modern web technologies for a frictionless user experience.',
        'font-size: 14px; color: #6b7280;'
    );

})();
