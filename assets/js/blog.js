document.addEventListener('DOMContentLoaded', () => {
    initBlogFilters();
    initCopyLink();
});

// One predicate keeps current-page search and categories consistent in either order.
function initBlogFilters() {
    const input = document.getElementById('blog-search');
    if (!input) return;
    const clear = document.getElementById('blog-search-clear');
    const buttons = [...document.querySelectorAll('.blog-category-pill')];
    const cards = [...document.querySelectorAll('.blog-card')];
    const empty = document.querySelector('.blog-no-results');
    const status = document.getElementById('blog-result-count');
    let category = 'all';
    function update() {
        const query = input.value.trim().toLocaleLowerCase();
        let count = 0;
        cards.forEach(card => {
            const text = ['.blog-card-title', '.blog-card-excerpt', '.blog-card-category']
                .map(selector => card.querySelector(selector)?.textContent || '').join(' ')
                .toLocaleLowerCase();
            const matches = (category === 'all' || card.dataset.category === category)
                && (!query || text.includes(query));
            card.hidden = !matches;
            if (matches) count++;
        });
        clear.hidden = !input.value;
        empty.hidden = count > 0;
        status.textContent = `${count} ${count === 1 ? 'article' : 'articles'} on this page`;
        buttons.forEach(button => {
            const active = button.dataset.category === category;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    }
    input.addEventListener('input', update);
    clear.addEventListener('click', () => { input.value = ''; update(); input.focus(); });
    buttons.forEach(button => button.addEventListener('click', () => {
        category = button.dataset.category;
        update();
    }));
    window.addEventListener('pageshow', update);
    update();
}

function initCopyLink() {
    document.querySelectorAll('.copy-link').forEach(button => {
        const label = button.querySelector('[data-copy-label]');
        button.addEventListener('click', async () => {
            const url = button.dataset.url || window.location.href;
            try {
                await navigator.clipboard.writeText(url);
                label.textContent = 'Link copied';
            } catch (_) {
                // Offer a selectable URL when clipboard permissions are denied.
                let field = button.parentElement.querySelector('.copy-link-fallback');
                if (!field) {
                    field = document.createElement('input');
                    field.className = 'copy-link-fallback';
                    field.readOnly = true;
                    field.setAttribute('aria-label', 'Article link. Select and copy this URL.');
                    button.parentElement.appendChild(field);
                }
                field.value = url;
                field.focus();
                field.select();
                label.textContent = 'Select and copy the link';
            }
        });
    });
}
