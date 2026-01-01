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
    // SCROLL REVEAL
    // ============================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Elements to reveal on scroll
    const revealSelectors = [
        '.step-card',
        '.testimonial-card',
        '.faq-item',
        '.bento-card',
        '.gallery-item',
        '.comparison-card'
    ];

    revealSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`;
            revealObserver.observe(el);
        });
    });

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
});
