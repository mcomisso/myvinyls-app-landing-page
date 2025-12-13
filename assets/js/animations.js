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
    // SCROLL REVEAL
    // ============================================
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card, .showcase-content, .cta-content').forEach((el) => {
        el.classList.add('reveal');
        revealObserver.observe(el);
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
});
