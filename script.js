document.addEventListener('DOMContentLoaded', () => {
    
    gsap.registerPlugin(ScrollTrigger);

    // Emergency preloader removal
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
                preloader.style.visibility = 'hidden';
            }, 400);
        }
    }, 2500);

    // Content visibility fallback
    setTimeout(() => {
        document.querySelectorAll('.word, .hero-desc, .hero-badge, .feature-card, .portfolio-item').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
            el.style.visibility = 'visible';
        });
    }, 1200);

    // Initialize Lenis - optimized for mobile
    let lenis = null;
    const isMobile = window.innerWidth < 768;
    
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: isMobile ? 0.8 : 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: isMobile ? 0.5 : 1,
            touchMultiplier: 1.2,
            smoothTouch: !isMobile
        });
        
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
        
        lenis.on('scroll', (e) => {
            ScrollTrigger.update();
            updateBackToTop(e.scroll);
        });
        
        gsap.ticker.add((time) => lenis.raf(time * 1000));
    }

    // Simple preloader animation
    const tl = gsap.timeline();
    tl.to('.preloader-letter', {
        y: 0, opacity: 1, stagger: 0.06, duration: 0.4, ease: 'back.out(1.2)'
    })
    .to('.preloader-line', { width: '80px', duration: 0.5 }, '-=0.2')
    .to('.preloader-letter, .preloader-line', {
        y: -30, opacity: 0, stagger: 0.04, duration: 0.4, delay: 0.2
    })
    .to('.preloader-overlay', {
        scaleY: 0, transformOrigin: 'top', duration: 0.8, ease: 'expo.inOut'
    }, '-=0.2')
    .set('#preloader', { display: 'none', visibility: 'hidden' })
    .from('.sticky-header, .menu-toggle', { y: -40, opacity: 0, duration: 0.6 })
    .from('.hero .word', { yPercent: 100, opacity: 0, stagger: 0.06, duration: 0.8 }, '-=0.2')
    .from('.hero-desc, .hero-badge, .hero-eyebrow', { y: 20, opacity: 0, stagger: 0.08, duration: 0.5 }, '-=0.3')
    .from('.hero-stats .stat-card', { y: 30, opacity: 0, stagger: 0.08, duration: 0.5 }, '-=0.2')
    .from('.hero-actions', { y: 20, opacity: 0, duration: 0.5 }, '-=0.2')
    .from('.floating-card, .floating-stat', { scale: 0.9, opacity: 0, duration: 0.5 }, '-=0.3')
    .add(() => document.querySelector('.hero')?.classList.add('visible'), '-=0.3');

    // Stats counter
    document.querySelectorAll('.stat-number').forEach(stat => {
        const target = parseFloat(stat.dataset.target);
        if (!isNaN(target)) {
            const obj = { val: 0 };
            gsap.to(obj, {
                val: target, duration: 2,
                scrollTrigger: { trigger: stat, start: 'top 90%' },
                onUpdate: function() {
                    stat.innerText = target % 1 === 0 ? Math.round(obj.val) : obj.val.toFixed(1);
                }
            });
        }
    });

    // Portfolio drag scroll
    const scrollContainer = document.querySelector('.portfolio-horizontal');
    if (scrollContainer) {
        let isDown = false, startX, scrollLeft;
        
        scrollContainer.addEventListener('mousedown', (e) => {
            isDown = true;
            scrollContainer.classList.add('dragging');
            startX = e.pageX - scrollContainer.offsetLeft;
            scrollLeft = scrollContainer.scrollLeft;
        });
        
        scrollContainer.addEventListener('mouseleave', () => {
            isDown = false;
            scrollContainer.classList.remove('dragging');
        });
        
        scrollContainer.addEventListener('mouseup', () => {
            isDown = false;
            scrollContainer.classList.remove('dragging');
        });
        
        scrollContainer.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - scrollContainer.offsetLeft;
            const walk = (x - startX) * 1.5;
            scrollContainer.scrollLeft = scrollLeft - walk;
        });

        // Touch events
        scrollContainer.addEventListener('touchstart', (e) => {
            isDown = true;
            startX = e.touches[0].pageX - scrollContainer.offsetLeft;
            scrollLeft = scrollContainer.scrollLeft;
        }, { passive: true });
        
        scrollContainer.addEventListener('touchend', () => {
            isDown = false;
        });
        
        scrollContainer.addEventListener('touchmove', (e) => {
            if (!isDown) return;
            const x = e.touches[0].pageX - scrollContainer.offsetLeft;
            const walk = (x - startX) * 1.5;
            scrollContainer.scrollLeft = scrollLeft - walk;
        }, { passive: true });
    }

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
                if (lenis) lenis.scrollTo(target, { offset: -60 });
                else target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Back to top
    const backBtn = document.getElementById('back-to-top');
    function updateBackToTop(scrollY) {
        if (backBtn) backBtn.classList.toggle('visible', scrollY > 500);
    }
    window.addEventListener('scroll', () => updateBackToTop(window.scrollY));
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (lenis) lenis.scrollTo(0);
            else window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Form
    const form = document.getElementById('inquiry-form');
    const feedback = document.querySelector('.form-feedback');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name')?.value;
            const email = document.getElementById('email')?.value;
            if (name && email) {
                feedback.innerHTML = '<span style="color: #c9a96b;">✓ Inquiry received.</span>';
                form.reset();
            } else {
                feedback.innerHTML = '<span style="color: #ff6b6b;">Please complete all fields.</span>';
            }
        });
    }

    // Video button
    document.querySelector('[data-video-trigger]')?.addEventListener('click', () => {
        alert('Brand film would play here.');
    });

    // Image fallback
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function() {
            if (!this.src.includes('placehold.co')) {
                this.src = `https://placehold.co/500x400/1a1c22/c9a96b?text=Vertica`;
            }
        });
    });

    // Resize handler
    window.addEventListener('resize', () => {
        setTimeout(() => {
            ScrollTrigger.refresh();
            if (lenis) lenis.resize();
        }, 200);
    });

});