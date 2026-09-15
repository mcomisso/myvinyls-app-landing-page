// Apply the theme before content paints; storage may be unavailable in private contexts.
(() => {
    const system = window.matchMedia('(prefers-color-scheme: dark)');
    let preference = 'system';
    try { preference = localStorage.getItem('theme') || 'system'; } catch (_) {}
    if (!['light', 'dark', 'system'].includes(preference)) preference = 'system';

    function apply() {
        const theme = preference === 'system' ? (system.matches ? 'dark' : 'light') : preference;
        document.documentElement.dataset.theme = theme;
        document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
            meta.content = theme === 'dark' ? (meta.dataset.themeDark || '#111214') : (meta.dataset.themeLight || '#f8f6ef');
        });
        document.querySelectorAll('[data-theme-select]').forEach(select => { select.value = preference; });
        document.querySelectorAll('[data-theme-toggle]').forEach(button => {
            button.hidden = false;
            button.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
            button.setAttribute('aria-pressed', String(theme === 'dark'));
        });
    }
    apply();
    system.addEventListener('change', apply);
    window.addEventListener('storage', event => {
        if (event.key !== 'theme') return;
        preference = ['light', 'dark'].includes(event.newValue) ? event.newValue : 'system';
        apply();
    });
    document.addEventListener('DOMContentLoaded', () => {
        function save(next) {
            preference = next;
            try { localStorage.setItem('theme', preference); } catch (_) {}
            apply();
        }
        document.querySelectorAll('[data-theme-select]').forEach(select => {
            select.closest('.site-appearance').hidden = false;
            select.addEventListener('change', () => save(select.value));
        });
        document.querySelectorAll('[data-theme-toggle]').forEach(button => {
            button.addEventListener('click', () => save(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
        });
        apply();
    });
})();
