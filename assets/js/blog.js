document.addEventListener('DOMContentLoaded', function() {
    initBlogSearch();
    initCategoryFilter();
    initReadingTime();
    initCopyLink();
    initScrollReveal();
});

function initBlogSearch() {
    const searchInput = document.getElementById('blog-search');
    const clearButton = document.getElementById('blog-search-clear');

    if (!searchInput) return;

    const blogCards = document.querySelectorAll('.blog-card');
    let debounceTimer;

    searchInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        const query = this.value.trim();

        if (clearButton) {
            clearButton.style.display = query ? 'block' : 'none';
        }

        debounceTimer = setTimeout(() => {
            filterPosts(query.toLowerCase(), blogCards);
        }, 200);
    });

    if (clearButton) {
        clearButton.addEventListener('click', function() {
            searchInput.value = '';
            this.style.display = 'none';
            filterPosts('', blogCards);
            searchInput.focus();
        });
    }
}

function filterPosts(query, cards) {
    let visibleCount = 0;
    const activeCategory = document.querySelector('.blog-category-pill.active')?.dataset.category || 'all';

    cards.forEach(card => {
        const title = card.querySelector('.blog-card-title')?.textContent.toLowerCase() || '';
        const excerpt = card.querySelector('.blog-card-excerpt')?.textContent.toLowerCase() || '';
        const category = card.dataset.category?.toLowerCase() || '';
        const categoryName = card.querySelector('.blog-card-category')?.textContent.toLowerCase() || '';

        const matchesSearch = query === '' ||
            title.includes(query) ||
            excerpt.includes(query) ||
            category.includes(query) ||
            categoryName.includes(query);

        const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;

        if (matchesSearch && matchesCategory) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    toggleNoResults(visibleCount === 0);
}

function initCategoryFilter() {
    const categoryPills = document.querySelectorAll('.blog-category-pill');
    const blogCards = document.querySelectorAll('.blog-card');
    const searchInput = document.getElementById('blog-search');

    if (categoryPills.length === 0) return;

    categoryPills.forEach(pill => {
        pill.addEventListener('click', function(e) {
            e.preventDefault();

            categoryPills.forEach(p => p.classList.remove('active'));
            this.classList.add('active');

            const category = this.dataset.category;
            const searchQuery = searchInput?.value.toLowerCase().trim() || '';

            let visibleCount = 0;

            blogCards.forEach(card => {
                const matchesCategory = category === 'all' || card.dataset.category === category;

                let matchesSearch = true;
                if (searchQuery) {
                    const title = card.querySelector('.blog-card-title')?.textContent.toLowerCase() || '';
                    const excerpt = card.querySelector('.blog-card-excerpt')?.textContent.toLowerCase() || '';
                    matchesSearch = title.includes(searchQuery) || excerpt.includes(searchQuery);
                }

                if (matchesCategory && matchesSearch) {
                    card.style.display = '';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            toggleNoResults(visibleCount === 0);
        });
    });
}

function toggleNoResults(show) {
    const noResults = document.querySelector('.blog-no-results');

    if (noResults) {
        noResults.style.display = show ? 'block' : 'none';
    }
}

function initReadingTime() {
    const articleContent = document.querySelector('.article-content');
    const readingTimeEl = document.querySelector('.reading-time');

    if (articleContent && readingTimeEl) {
        const text = articleContent.textContent || '';
        const wordsPerMinute = 200;
        const wordCount = text.trim().split(/\s+/).length;
        const minutes = Math.ceil(wordCount / wordsPerMinute);
        readingTimeEl.textContent = `${minutes} min read`;
    }
}

function initCopyLink() {
    const copyButtons = document.querySelectorAll('.copy-link');

    copyButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const url = this.dataset.url || window.location.href;

            try {
                await navigator.clipboard.writeText(url);

                const icon = this.querySelector('i');
                const originalClass = icon.className;
                icon.className = 'fas fa-check';

                setTimeout(() => {
                    icon.className = originalClass;
                }, 2000);
            } catch (err) {

                const textArea = document.createElement('textarea');
                textArea.value = url;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
        });
    });
}

function initScrollReveal() {
    const cards = document.querySelectorAll('.blog-card');

    if (cards.length === 0) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {

                    entry.target.style.transitionDelay = `${index * 0.05}s`;
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            observer.observe(card);
        });

        const style = document.createElement('style');
        style.textContent = `
            .blog-card.revealed {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
        `;
        document.head.appendChild(style);
    }
}
