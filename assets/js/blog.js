/**
 * Blog Interactivity
 * Handles search filtering, category selection, reading time, and copy link
 */

document.addEventListener('DOMContentLoaded', function() {
    initBlogSearch();
    initCategoryFilter();
    initReadingTime();
    initCopyLink();
    initScrollReveal();
});

/**
 * Initialize Blog Search
 * Client-side search filtering for blog posts
 */
function initBlogSearch() {
    const searchInput = document.getElementById('blog-search');
    const clearButton = document.getElementById('blog-search-clear');

    if (!searchInput) return;

    const blogCards = document.querySelectorAll('.blog-card');
    let debounceTimer;

    searchInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        const query = this.value.trim();

        // Show/hide clear button
        if (clearButton) {
            clearButton.style.display = query ? 'block' : 'none';
        }

        debounceTimer = setTimeout(() => {
            filterPosts(query.toLowerCase(), blogCards);
        }, 200);
    });

    // Clear button functionality
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            searchInput.value = '';
            this.style.display = 'none';
            filterPosts('', blogCards);
            searchInput.focus();
        });
    }
}

/**
 * Filter posts by search query
 */
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

/**
 * Initialize Category Filter
 */
function initCategoryFilter() {
    const categoryPills = document.querySelectorAll('.blog-category-pill');
    const blogCards = document.querySelectorAll('.blog-card');
    const searchInput = document.getElementById('blog-search');

    if (categoryPills.length === 0) return;

    categoryPills.forEach(pill => {
        pill.addEventListener('click', function(e) {
            e.preventDefault();

            // Update active state
            categoryPills.forEach(p => p.classList.remove('active'));
            this.classList.add('active');

            const category = this.dataset.category;
            const searchQuery = searchInput?.value.toLowerCase().trim() || '';

            // Filter cards
            let visibleCount = 0;

            blogCards.forEach(card => {
                const matchesCategory = category === 'all' || card.dataset.category === category;

                // Also check search query if present
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

/**
 * Toggle no results message
 */
function toggleNoResults(show) {
    const noResults = document.querySelector('.blog-no-results');

    if (noResults) {
        noResults.style.display = show ? 'block' : 'none';
    }
}

/**
 * Calculate and display reading time
 */
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

/**
 * Copy link to clipboard functionality
 */
function initCopyLink() {
    const copyButtons = document.querySelectorAll('.copy-link');

    copyButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const url = this.dataset.url || window.location.href;

            try {
                await navigator.clipboard.writeText(url);

                // Show feedback
                const icon = this.querySelector('i');
                const originalClass = icon.className;
                icon.className = 'fas fa-check';

                setTimeout(() => {
                    icon.className = originalClass;
                }, 2000);
            } catch (err) {
                // Fallback for older browsers
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

/**
 * Initialize scroll reveal for blog cards
 */
function initScrollReveal() {
    const cards = document.querySelectorAll('.blog-card');

    if (cards.length === 0) return;

    // Check if IntersectionObserver is available
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Add staggered delay
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

        // Add revealed state styles
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
