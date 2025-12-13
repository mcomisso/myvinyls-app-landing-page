document.addEventListener('DOMContentLoaded', () => {
    // ============================================
    // HEADER SCROLL EFFECT
    // ============================================
    const header = document.querySelector('.site-header');

    const handleHeaderScroll = () => {
        if (window.scrollY > 20) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    handleHeaderScroll();

    // ============================================
    // VINYL INTERACTION & SPIN
    // ============================================
    const vinylContainer = document.querySelector('.vinyl-container');
    const vinylRecord = document.querySelector('.vinyl-record');
    const albumSleeve = document.querySelector('.album-sleeve');

    if (vinylContainer && vinylRecord) {
        // Start spinning immediately
        vinylRecord.classList.add('spinning');

        let currentX = 0, currentY = 0;
        let targetX = 0, targetY = 0;

        // Smooth tilt animation
        const animateTilt = () => {
            currentX += (targetX - currentX) * 0.08;
            currentY += (targetY - currentY) * 0.08;

            const rotateX = -currentY * 15;
            const rotateY = currentX * 15;

            vinylContainer.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

            // Parallax effect for internal elements
            if (albumSleeve) {
                albumSleeve.style.transform = `translateZ(20px) rotateX(${rotateX * 0.5}deg) rotateY(${rotateY * 0.5}deg)`;
            }

            requestAnimationFrame(animateTilt);
        };
        animateTilt();

        // Mouse interaction
        vinylContainer.addEventListener('mousemove', (e) => {
            const rect = vinylContainer.getBoundingClientRect();
            targetX = (e.clientX - rect.left) / rect.width - 0.5;
            targetY = (e.clientY - rect.top) / rect.height - 0.5;
        });

        vinylContainer.addEventListener('mouseleave', () => {
            targetX = 0;
            targetY = 0;

            // Return record to sleeve partially
            vinylRecord.style.transform = 'translateX(0) rotate(0deg)';
        });

        // Pull record out on hover
        vinylContainer.addEventListener('mouseenter', () => {
            // We keep the spinning class but maybe adjust position
        });
    }

    // ============================================
    // BLOB PARALLAX
    // ============================================
    const blobs = document.querySelectorAll('.blob');

    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        blobs.forEach((blob, index) => {
            const speed = (index + 1) * 20;
            const xOffset = (x - 0.5) * speed;
            const yOffset = (y - 0.5) * speed;

            blob.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        });
    });

    // ============================================
    // SCROLL REVEAL WITH STAGGER
    // ============================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -80px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Elements to reveal on scroll
    const revealSelectors = [
        '.feature-card',
        '.showcase-content',
        '.showcase-phones',
        '.cta-content',
        '.step-card',
        '.testimonial-card',
        '.comparison-card',
        '.faq-item',
        '.bento-card',
        '.section-header',
        '.hero-stats',
        '.hero-badge-top'
    ];

    revealSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach((el, index) => {
            el.classList.add('reveal');
            el.style.transitionDelay = `${index * 0.1}s`;
            revealObserver.observe(el);
        });
    });

    // ============================================
    // COUNTER ANIMATION FOR STATS
    // ============================================
    const animateCounter = (element, target, suffix = '') => {
        const duration = 2000;
        const start = 0;
        const startTime = performance.now();

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(easeOutQuart * target);

            element.textContent = current.toLocaleString() + suffix;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target.toLocaleString() + suffix;
            }
        };

        requestAnimationFrame(updateCounter);
    };

    // Observe stats for counter animation
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const statNumbers = entry.target.querySelectorAll('.stat-number');
                statNumbers.forEach(stat => {
                    const text = stat.textContent;
                    if (text.includes('M')) {
                        animateCounter(stat, 15, 'M+');
                    } else if (text.includes('K')) {
                        animateCounter(stat, 50, 'K+');
                    } else if (text.includes('.')) {
                        // Rating - just fade in
                        stat.style.opacity = '1';
                    }
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        statsObserver.observe(heroStats);
    }

    // ============================================
    // SMOOTH SCROLL FOR ANCHORS
    // ============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ============================================
    // THEME TOGGLE
    // ============================================
    const themeToggle = document.querySelector('.theme-toggle');

    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        const savedTheme = localStorage.getItem('theme') || 'dark';

        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);

            // Animation
            themeToggle.style.transform = 'rotate(180deg)';
            setTimeout(() => themeToggle.style.transform = '', 300);
        });

        function updateThemeIcon(theme) {
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
            }
        }
    }

    // ============================================
    // MOBILE MENU (Optional enhancement)
    // ============================================
    // Add mobile menu toggle functionality here if needed
});
