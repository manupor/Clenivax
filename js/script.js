document.addEventListener('DOMContentLoaded', () => {

    /* ── Sticky header scroll class ─────────────── */
    const header = document.querySelector('.main-header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 40);
        });
    }

    /* ══════════════════════════════════════════════
       SCROLL MICRO-ANIMATIONS
       Uses IntersectionObserver — no extra library.
       ══════════════════════════════════════════════ */

    // Helper: add classes to an element
    function prep(el, variant, delay) {
        el.classList.add('clnvx-anim', variant);
        if (delay) el.classList.add(delay);
    }

    // ── Feature highlight boxes ─────────────────
    document.querySelectorAll('.message-block').forEach((el, i) => {
        prep(el, 'clnvx-fade-up', 'clnvx-d' + (i + 1));
    });

    // ── About section header + service blocks ───
    const svcHeader = document.querySelector('.service-section .section-header');
    if (svcHeader) prep(svcHeader, 'clnvx-fade-up', 'clnvx-d1');
    document.querySelectorAll('.service-block').forEach((el, i) => {
        prep(el, 'clnvx-fade-up', 'clnvx-d' + (i + 2));
    });

    // ── Appointment form ────────────────────────
    const form = document.querySelector('.appoinment-form');
    if (form) prep(form, 'clnvx-fade-left', 'clnvx-d2');

    // ── CTA call-out ────────────────────────────
    const callOut = document.querySelector('.call-out-content');
    if (callOut) prep(callOut, 'clnvx-zoom-in', 'clnvx-d1');

    // ── Product blocks ──────────────────────────
    document.querySelectorAll('.what-we-do-block').forEach((el, i) => {
        const d = (i % 9) + 1;
        prep(el, 'clnvx-fade-up', 'clnvx-d' + d);
    });

    // ── Why Clenivax blocks ─────────────────────
    const weAreBestHeader = document.querySelector('.we-are-best .section-header');
    if (weAreBestHeader) prep(weAreBestHeader, 'clnvx-fade-left', 'clnvx-d1');
    document.querySelectorAll('.we-are-best-block').forEach((el, i) => {
        prep(el, 'clnvx-fade-left', 'clnvx-d' + (i + 2));
    });

    // ── Accordion panels ────────────────────────
    const deptHeader = document.querySelector('.departments .section-header');
    if (deptHeader) prep(deptHeader, 'clnvx-fade-right', 'clnvx-d1');
    document.querySelectorAll('.departments .panel').forEach((el, i) => {
        prep(el, 'clnvx-fade-right', 'clnvx-d' + (i + 2));
    });

    // ── Stats counter ───────────────────────────
    const happyCust = document.querySelector('.happy-customer');
    if (happyCust) prep(happyCust, 'clnvx-fade-left', 'clnvx-d1');
    document.querySelectorAll('.statistics-box').forEach((el, i) => {
        prep(el, 'clnvx-fade-up', 'clnvx-d' + (i + 2));
    });

    // ── Footer contact boxes ────────────────────
    document.querySelectorAll('.contact-details .detail-box').forEach((el, i) => {
        prep(el, 'clnvx-fade-up', 'clnvx-d' + (i + 1));
    });

    // ── Footer widgets ──────────────────────────
    document.querySelectorAll('.footer-main .widget').forEach((el, i) => {
        prep(el, 'clnvx-fade-up', 'clnvx-d' + (i + 1));
    });

    /* ── IntersectionObserver ───────────────────── */
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // fire once
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.clnvx-anim').forEach(el => observer.observe(el));

});
