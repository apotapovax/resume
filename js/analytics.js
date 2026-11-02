(() => {
    // Dashboard: https://apotapovax.goatcounter.com  (create the site once at goatcounter.com/signup)
    const pending = [];

    window.track = (path, title) => {
        if (!path) return;
        const ev = {
            path: String(path).replace(/^\//, ''),
            title: title || String(path),
            event: true,
            no_session: true,
        };
        if (typeof window.goatcounter?.count === 'function') window.goatcounter.count(ev);
        else pending.push(ev);
    };

    const flush = setInterval(() => {
        if (typeof window.goatcounter?.count !== 'function') return;
        clearInterval(flush);
        while (pending.length) window.goatcounter.count(pending.shift());
    }, 50);
    setTimeout(() => clearInterval(flush), 15000);

    document.addEventListener('click', (e) => {
        const el = e.target.closest('a');
        if (!el) return;
        const href = (el.getAttribute('href') || '').trim();
        const low = href.toLowerCase();
        if (low.startsWith('mailto:')) window.track('click-email', 'Email');
        else if (low.startsWith('tel:')) window.track('click-phone', 'Phone');
        else if (low.includes('linkedin.com')) window.track('click-linkedin', 'LinkedIn');
        else if (/\.pdf(\b|$)/i.test(low)) window.track('click-pdf', 'Download PDF');
        else if (low.includes('resume-yaml')) window.track('click-yaml', 'View YAML');
        else if (href === '#terminal' || el.hasAttribute('data-open-terminal')) return;
        else if (href.startsWith('#') && href.length > 1) window.track('nav-' + href.slice(1), 'Nav ' + href.slice(1));
    });

    const seen = new Set();
    const watch = () => {
        ['about', 'experience', 'skills', 'certifications', 'education', 'contact'].forEach((id) => {
            const el = document.getElementById(id);
            if (!el || seen.has(id)) return;
            const io = new IntersectionObserver((entries) => {
                if (!entries.some((x) => x.isIntersecting)) return;
                seen.add(id);
                window.track('view-' + id, 'Saw ' + id);
                io.disconnect();
            }, { threshold: 0.35 });
            io.observe(el);
        });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
    else watch();
})();
