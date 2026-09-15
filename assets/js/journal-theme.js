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
            meta.content = theme === 'dark' ? '#202622' : '#f8f6ef';
        });
        const select = document.getElementById('journal-theme');
        if (select) select.value = preference;
    }
    apply();
    system.addEventListener('change', apply);
    window.addEventListener('storage', event => {
        if (event.key !== 'theme') return;
        preference = ['light', 'dark'].includes(event.newValue) ? event.newValue : 'system';
        apply();
    });
    document.addEventListener('DOMContentLoaded', () => {
        const select = document.getElementById('journal-theme');
        if (!select) return;
        select.closest('.journal-appearance').hidden = false;
        select.value = preference;
        select.addEventListener('change', () => {
            preference = select.value;
            try { localStorage.setItem('theme', preference); } catch (_) {}
            apply();
        });
    });
})();
