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
       Double RAF ensures browser paints opacity:0
       before observation starts.
       ══════════════════════════════════════════════ */

    function prep(el, variant, delay) {
        if (!el) return;
        el.classList.add('clnvx-anim', variant);
        if (delay) el.classList.add(delay);
    }

    function prepAll(selector, variant, baseDelay) {
        document.querySelectorAll(selector).forEach((el, i) => {
            const d = Math.min((baseDelay || 0) + i + 1, 9);
            prep(el, variant, 'clnvx-d' + d);
        });
    }

    /* ── Regulatory Detail Modals ───────────────── */
    function openModal(id) {
        const m = document.getElementById(id);
        if (!m) return;
        m.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        m.querySelector('.clnvx-modal-close').focus();
    }
    function closeModal(m) {
        m.classList.remove('is-open');
        document.body.style.overflow = '';
    }
    document.querySelectorAll('.clnvx-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => openModal(btn.dataset.modal));
    });
    document.querySelectorAll('.clnvx-modal-close, .clnvx-modal-overlay').forEach(el => {
        el.addEventListener('click', () => closeModal(el.closest('.clnvx-modal')));
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.clnvx-modal.is-open').forEach(closeModal);
        }
    });

    // ── Hero text (already visible — no anim) ───

    // ── Feature highlight boxes ─────────────────
    prepAll('.message-block', 'clnvx-fade-up');

    // ── About section ───────────────────────────
    prep(document.querySelector('.service-section .section-header'), 'clnvx-fade-up', 'clnvx-d1');
    prepAll('.service-block', 'clnvx-fade-up', 1);
    prep(document.querySelector('.appoinment-form'), 'clnvx-fade-right', 'clnvx-d2');

    // ── CTA call-out ────────────────────────────
    prep(document.querySelector('.call-out'), 'clnvx-zoom-in', 'clnvx-d1');

    // ── Products section header ──────────────────
    prep(document.querySelector('.what-we-do-best .section-header'), 'clnvx-fade-up', 'clnvx-d1');
    prepAll('.what-we-do-block', 'clnvx-fade-up');

    // ── Why Clenivax ─────────────────────────────
    prep(document.querySelector('.we-are-best .section-header'), 'clnvx-fade-left', 'clnvx-d1');
    prepAll('.we-are-best-block', 'clnvx-fade-left', 1);

    // ── Accordion ────────────────────────────────
    prep(document.querySelector('.departments .section-header'), 'clnvx-fade-right', 'clnvx-d1');
    prepAll('.departments .panel', 'clnvx-fade-right', 1);

    // ── Stats ─────────────────────────────────────
    prep(document.querySelector('.happy-customer'), 'clnvx-fade-left', 'clnvx-d1');
    prepAll('.statistics-box', 'clnvx-fade-up', 1);

    // ── Footer ────────────────────────────────────
    prepAll('.contact-details .detail-box', 'clnvx-fade-up');
    prepAll('.footer-main .widget', 'clnvx-fade-up');

    /* ── Observer — start AFTER browser paints hidden state ── */
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px'
    });

    // Double RAF: ensures 2 paint frames have elapsed so
    // opacity:0 is actually rendered before we start watching
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.querySelectorAll('.clnvx-anim').forEach(el => observer.observe(el));
        });
    });

});
