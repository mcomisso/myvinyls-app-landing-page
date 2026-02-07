/**
 * FAQ Page Interactivity
 * Handles accordion functionality and search filtering
 */

document.addEventListener('DOMContentLoaded', function() {
    initFAQAccordion();
    initFAQSearch();
});

/**
 * Initialize FAQ Accordion
 * Allows users to expand/collapse FAQ items
 */
function initFAQAccordion() {
    const accordionHeaders = document.querySelectorAll('.faq-accordion-header');

    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const item = this.closest('.faq-accordion-item');
            const isActive = item.classList.contains('active');

            // Close all other items in the same accordion (optional - remove for multi-open)
            // const siblings = item.parentElement.querySelectorAll('.faq-accordion-item');
            // siblings.forEach(sibling => sibling.classList.remove('active'));

            // Toggle current item
            if (isActive) {
                item.classList.remove('active');
                this.setAttribute('aria-expanded', 'false');
            } else {
                item.classList.add('active');
                this.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

/**
 * Initialize FAQ Search
 * Filters FAQ items based on search input
 */
function initFAQSearch() {
    const searchInput = document.getElementById('faq-search');
    const clearButton = document.getElementById('faq-search-clear');

    if (!searchInput) return;

    let debounceTimer;

    searchInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            filterFAQ(this.value.trim().toLowerCase());

            // Show/hide clear button
            if (clearButton) {
                clearButton.style.display = this.value.length > 0 ? 'flex' : 'none';
            }
        }, 200);
    });

    // Clear button functionality
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            searchInput.value = '';
            filterFAQ('');
            this.style.display = 'none';
            searchInput.focus();
        });
    }
}

/**
 * Filter FAQ items based on search query
 * @param {string} query - The search query
 */
function filterFAQ(query) {
    const categories = document.querySelectorAll('.faq-category');
    const quickLinks = document.querySelector('.faq-quick-links');
    let totalMatches = 0;

    // Remove existing no-results message
    const existingNoResults = document.querySelector('.faq-no-results');
    if (existingNoResults) {
        existingNoResults.remove();
    }

    if (query === '') {
        // Show everything when search is empty
        categories.forEach(category => {
            category.classList.remove('hidden');
            const items = category.querySelectorAll('.faq-accordion-item');
            items.forEach(item => {
                item.classList.remove('hidden');
                item.classList.remove('active');
                const btn = item.querySelector('.faq-accordion-header');
                if (btn) btn.setAttribute('aria-expanded', 'false');
                removeHighlights(item);
            });
        });
        if (quickLinks) quickLinks.classList.remove('hidden');
        return;
    }

    // Hide quick links during search
    if (quickLinks) quickLinks.classList.add('hidden');

    categories.forEach(category => {
        const items = category.querySelectorAll('.faq-accordion-item');
        let categoryMatches = 0;

        items.forEach(item => {
            const header = item.querySelector('.faq-accordion-header span');
            const content = item.querySelector('.faq-accordion-content');
            const headerText = header ? header.textContent.toLowerCase() : '';
            const contentText = content ? content.textContent.toLowerCase() : '';

            if (headerText.includes(query) || contentText.includes(query)) {
                item.classList.remove('hidden');
                item.classList.add('active'); // Expand matching items
                const btn = item.querySelector('.faq-accordion-header');
                if (btn) btn.setAttribute('aria-expanded', 'true');
                categoryMatches++;
                totalMatches++;

                // Add highlighting
                if (header) highlightText(header, query);
                if (content) highlightTextInElement(content, query);
            } else {
                item.classList.add('hidden');
                item.classList.remove('active');
                const btn = item.querySelector('.faq-accordion-header');
                if (btn) btn.setAttribute('aria-expanded', 'false');
                removeHighlights(item);
            }
        });

        // Hide category if no items match
        if (categoryMatches === 0) {
            category.classList.add('hidden');
        } else {
            category.classList.remove('hidden');
        }
    });

    // Show no results message if needed
    if (totalMatches === 0) {
        showNoResults(query);
    }
}

/**
 * Highlight matching text in an element
 * @param {HTMLElement} element - The element to highlight in
 * @param {string} query - The search query
 */
function highlightText(element, query) {
    const text = element.textContent;
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    element.innerHTML = text.replace(regex, '<mark class="faq-highlight">$1</mark>');
}

/**
 * Highlight matching text in content element (handles nested elements)
 * @param {HTMLElement} element - The content element
 * @param {string} query - The search query
 */
function highlightTextInElement(element, query) {
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    const textNodes = [];
    while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
    }

    textNodes.forEach(node => {
        if (node.textContent.toLowerCase().includes(query)) {
            const span = document.createElement('span');
            const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
            span.innerHTML = node.textContent.replace(regex, '<mark class="faq-highlight">$1</mark>');
            node.parentNode.replaceChild(span, node);
        }
    });
}

/**
 * Remove all highlights from an element
 * @param {HTMLElement} element - The element to remove highlights from
 */
function removeHighlights(element) {
    const highlights = element.querySelectorAll('.faq-highlight');
    highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize();
    });

    // Also handle wrapped spans from highlightTextInElement
    const wrappedSpans = element.querySelectorAll('.faq-accordion-content span');
    wrappedSpans.forEach(span => {
        if (span.querySelector('.faq-highlight') === null && span.childNodes.length === 1 && span.firstChild.nodeType === Node.TEXT_NODE) {
            span.parentNode.replaceChild(document.createTextNode(span.textContent), span);
        }
    });
}

/**
 * Show no results message
 * @param {string} query - The search query that yielded no results
 */
function showNoResults(query) {
    const container = document.querySelector('.faq-page-section .container');
    if (!container) return;

    const noResultsDiv = document.createElement('div');
    noResultsDiv.className = 'faq-no-results';
    noResultsDiv.innerHTML = `
        <i class="fas fa-search"></i>
        <h3>No results found</h3>
        <p>We couldn't find any answers matching "${escapeHtml(query)}". Try different keywords or browse the categories above.</p>
    `;

    container.appendChild(noResultsDiv);
}

/**
 * Escape special characters for use in RegExp
 * @param {string} string - The string to escape
 * @returns {string} - Escaped string
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Escape HTML to prevent XSS
 * @param {string} string - The string to escape
 * @returns {string} - Escaped string
 */
function escapeHtml(string) {
    const div = document.createElement('div');
    div.textContent = string;
    return div.innerHTML;
}

/**
 * Smooth scroll to category when clicking quick links
 */
document.querySelectorAll('.faq-quick-link').forEach(link => {
    link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                // Clear search when using quick links
                const searchInput = document.getElementById('faq-search');
                const clearButton = document.getElementById('faq-search-clear');
                if (searchInput) {
                    searchInput.value = '';
                    filterFAQ('');
                }
                if (clearButton) {
                    clearButton.style.display = 'none';
                }

                // Smooth scroll to target
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});
