document.addEventListener('DOMContentLoaded', () => {
    
    gsap.registerPlugin(ScrollTrigger);

    // Force remove preloader after timeout
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
                preloader.style.visibility = 'hidden';
            }, 500);
        }
    }, 4000);

    // Emergency content visibility
    setTimeout(() => {
        document.querySelectorAll('.word, .hero-desc, .hero-badge, .feature-card, .portfolio-item, .contact-container, .about-content').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
            el.style.visibility = 'visible';
        });
    }, 1500);

    // Initialize Lenis
    let lenis = null;
    const isMobile = window.innerWidth < 768;
    
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: isMobile ? 1.0 : 1.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: isMobile ? 0.5 : 1,
            touchMultiplier: 1.5,
            smoothTouch: false
        });
        
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
        
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
    }

    // Simple preloader animation
    const tl = gsap.timeline();
    tl.to('.preloader-letter', {
        y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: 'back.out(1.2)'
    })
    .to('.preloader-line', { width: '120px', duration: 0.6 }, '-=0.2')
    .to('.preloader-letter, .preloader-line', {
        y: -50, opacity: 0, stagger: 0.05, duration: 0.5, delay: 0.3
    })
    .to('.preloader-overlay', {
        scaleY: 0, transformOrigin: 'top', duration: 1, ease: 'expo.inOut'
    }, '-=0.3')
    .set('#preloader', { display: 'none', visibility: 'hidden' })
    .from('.sticky-header, .menu-toggle', { y: -50, opacity: 0, duration: 0.8 })
    .from('.hero .word', { yPercent: 100, opacity: 0, stagger: 0.08, duration: 1 }, '-=0.3')
    .from('.hero-desc, .hero-badge, .hero-eyebrow', { y: 30, opacity: 0, stagger: 0.1, duration: 0.6 }, '-=0.4')
    .from('.hero-stats .stat-card', { y: 40, opacity: 0, stagger: 0.1, duration: 0.6 }, '-=0.2')
    .from('.hero-actions', { y: 30, opacity: 0, duration: 0.6 }, '-=0.2')
    .from('.floating-card, .floating-stat', { scale: 0.8, opacity: 0, stagger: 0.1, duration: 0.6 }, '-=0.3')
    .add(() => document.querySelector('.hero')?.classList.add('visible'), '-=0.3');

    // Hero parallax
    gsap.to('.hero-visual', {
        y: 120, scale: 0.98,
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.5 }
    });

    // Stats counter
    document.querySelectorAll('.stat-number').forEach(stat => {
        const target = parseFloat(stat.dataset.target);
        if (!isNaN(target)) {
            gsap.to({ val: 0 }, {
                val: target, duration: 2,
                scrollTrigger: { trigger: stat, start: 'top 85%' },
                onUpdate: function() {
                    stat.innerText = target % 1 === 0 ? Math.round(this.targets()[0].val) : this.targets()[0].val.toFixed(1);
                }
            });
        }
    });

    // Portfolio horizontal scroll (desktop only)
    if (window.innerWidth > 1024) {
        const sections = gsap.utils.toArray('.portfolio-item');
        if (sections.length) {
            gsap.to(sections, {
                xPercent: -100 * (sections.length - 1),
                ease: "none",
                scrollTrigger: {
                    trigger: ".portfolio-horizontal",
                    pin: true,
                    scrub: 1,
                    snap: 1 / (sections.length - 1),
                    end: () => "+=" + (document.querySelector(".portfolio-horizontal").offsetWidth - window.innerWidth)
                }
            });
        }
    }

    // Section reveals
    gsap.from('.media-mask', {
        scale: 0.9, opacity: 0, duration: 1.5,
        scrollTrigger: { trigger: '.about', start: 'top 70%' }
    });

    gsap.to('.stat-circle-progress', {
        strokeDashoffset: 20, duration: 2,
        scrollTrigger: { trigger: '.about-stats-large', start: 'top 80%' }
    });

    gsap.from('.feature-card', {
        y: 50, opacity: 0, stagger: 0.1, duration: 0.8,
        scrollTrigger: { trigger: '.features-grid', start: 'top 85%' }
    });

    // Menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('fullscreen-nav');
    const links = document.querySelectorAll('[data-link]');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            nav.classList.toggle('active');
            document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
        });
    }
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (menuToggle) menuToggle.classList.remove('active');
            if (nav) nav.classList.remove('active');
            document.body.style.overflow = '';
            if (target) {
                if (lenis) lenis.scrollTo(target, { offset: -50 });
                else target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Back to top
    const backBtn = document.getElementById('back-to-top');
    if (backBtn) {
        window.addEventListener('scroll', () => {
            backBtn.classList.toggle('visible', window.scrollY > 600);
        });
        backBtn.addEventListener('click', () => {
            if (lenis) lenis.scrollTo(0);
            else window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Form handling
    const form = document.getElementById('inquiry-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const feedback = document.querySelector('.form-feedback');
            feedback.innerHTML = '<span style="color: #c9a96b;">✓ Inquiry received. Our concierge will respond shortly.</span>';
            form.reset();
        });
    }

    // Video button
    document.querySelector('[data-video-trigger]')?.addEventListener('click', () => {
        alert('Brand film would play here.');
    });

    // Refresh on resize
    window.addEventListener('resize', () => {
        setTimeout(() => {
            ScrollTrigger.refresh();
            if (lenis) lenis.resize();
        }, 200);
    });
});