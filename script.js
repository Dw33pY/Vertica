document.addEventListener('DOMContentLoaded', () => {
    
    gsap.registerPlugin(ScrollTrigger);

    // --- EMERGENCY PRELOADER REMOVAL ---
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
                preloader.style.visibility = 'hidden';
            }, 500);
        }
    }, 3000);

    // Emergency content visibility
    setTimeout(() => {
        document.querySelectorAll('.word, .hero-desc, .hero-badge, .feature-card, .portfolio-item, .stat-number').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
            el.style.visibility = 'visible';
        });
    }, 1500);

    // --- INITIALIZE LENIS ---
    let lenis = null;
    const isMobile = window.innerWidth < 768;
    
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: isMobile ? 1.0 : 1.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: isMobile ? 0.6 : 1,
            touchMultiplier: 1.5,
            smoothTouch: false
        });
        
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
        
        lenis.on('scroll', (e) => {
            ScrollTrigger.update();
            updateBackToTopProgress(e.scroll);
        });
        
        gsap.ticker.add((time) => lenis.raf(time * 1000));
    }

    // --- PRELOADER ANIMATION ---
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

    // --- HERO PARALLAX ---
    gsap.to('.hero-visual', {
        y: 120, scale: 0.98,
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.5 }
    });

    // --- STATS COUNTER ---
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const target = parseFloat(stat.dataset.target);
        if (!isNaN(target)) {
            const obj = { val: 0 };
            gsap.to(obj, {
                val: target,
                duration: 2.5,
                ease: 'power2.out',
                scrollTrigger: { trigger: stat, start: 'top 85%' },
                onUpdate: function() {
                    stat.innerText = target % 1 === 0 ? Math.round(obj.val) : obj.val.toFixed(1);
                }
            });
        }
    });

    // --- PORTFOLIO SMOOTH DRAG SCROLL (COMPLETELY REWRITTEN) ---
    const scrollContainer = document.querySelector('.portfolio-horizontal');
    const scrollTrack = document.querySelector('.portfolio-track');
    
    if (scrollContainer && scrollTrack) {
        let isDragging = false;
        let startX = 0;
        let startScrollLeft = 0;
        let velocity = 0;
        let momentumFrame = null;
        let dragThreshold = 5; // pixels to distinguish click from drag
        let hasMoved = false;
        
        // Disable GSAP horizontal scroll while user is dragging
        let gsapScrollTrigger = null;
        
        const startDrag = (clientX) => {
            isDragging = true;
            hasMoved = false;
            scrollContainer.classList.add('dragging');
            
            startX = clientX;
            startScrollLeft = scrollContainer.scrollLeft;
            velocity = 0;
            
            cancelMomentum();
            
            // Temporarily disable GSAP pin if exists
            if (window.innerWidth > 1024) {
                ScrollTrigger.getAll().forEach(st => {
                    if (st.vars.trigger === '.portfolio-horizontal') {
                        gsapScrollTrigger = st;
                        st.disable();
                    }
                });
            }
        };
        
        const onDrag = (clientX) => {
            if (!isDragging) return;
            
            const deltaX = clientX - startX;
            
            // Only consider it a drag if moved beyond threshold
            if (Math.abs(deltaX) > dragThreshold) {
                hasMoved = true;
            }
            
            const walk = deltaX * 1.8; // Sensitivity multiplier
            const newScrollLeft = startScrollLeft - walk;
            
            // Calculate velocity for momentum
            velocity = (newScrollLeft - scrollContainer.scrollLeft) * 0.8;
            
            scrollContainer.scrollLeft = Math.max(0, Math.min(newScrollLeft, scrollContainer.scrollWidth - scrollContainer.clientWidth));
        };
        
        const stopDrag = () => {
            if (!isDragging) return;
            
            isDragging = false;
            scrollContainer.classList.remove('dragging');
            
            // Start momentum scrolling
            startMomentum();
            
            // Re-enable GSAP pin after a short delay
            setTimeout(() => {
                if (gsapScrollTrigger) {
                    gsapScrollTrigger.enable();
                    gsapScrollTrigger = null;
                }
            }, 100);
        };
        
        const startMomentum = () => {
            cancelMomentum();
            
            const momentumLoop = () => {
                if (Math.abs(velocity) > 0.3) {
                    scrollContainer.scrollLeft += velocity;
                    velocity *= 0.94; // Friction
                    
                    // Clamp to bounds
                    const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
                    if (scrollContainer.scrollLeft < 0) {
                        scrollContainer.scrollLeft = 0;
                        velocity = 0;
                    } else if (scrollContainer.scrollLeft > maxScroll) {
                        scrollContainer.scrollLeft = maxScroll;
                        velocity = 0;
                    }
                    
                    momentumFrame = requestAnimationFrame(momentumLoop);
                } else {
                    // Snap to nearest item for better UX
                    snapToNearestItem();
                }
            };
            
            momentumFrame = requestAnimationFrame(momentumLoop);
        };
        
        const snapToNearestItem = () => {
            const items = document.querySelectorAll('.portfolio-item');
            if (!items.length) return;
            
            const containerRect = scrollContainer.getBoundingClientRect();
            const containerCenter = containerRect.left + containerRect.width / 2;
            
            let closestItem = null;
            let minDistance = Infinity;
            
            items.forEach(item => {
                const rect = item.getBoundingClientRect();
                const itemCenter = rect.left + rect.width / 2;
                const distance = Math.abs(itemCenter - containerCenter);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestItem = item;
                }
            });
            
            if (closestItem) {
                const targetScroll = closestItem.offsetLeft - (scrollContainer.clientWidth - closestItem.offsetWidth) / 2;
                smoothScrollTo(targetScroll);
            }
        };
        
        const smoothScrollTo = (target) => {
            const start = scrollContainer.scrollLeft;
            const distance = target - start;
            const duration = 400;
            const startTime = performance.now();
            
            const animateScroll = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing: easeOutCubic
                const ease = 1 - Math.pow(1 - progress, 3);
                
                scrollContainer.scrollLeft = start + distance * ease;
                
                if (progress < 1) {
                    requestAnimationFrame(animateScroll);
                }
            };
            
            requestAnimationFrame(animateScroll);
        };
        
        const cancelMomentum = () => {
            if (momentumFrame) {
                cancelAnimationFrame(momentumFrame);
                momentumFrame = null;
            }
        };
        
        const handleWheel = (e) => {
            if (scrollContainer.contains(e.target)) {
                e.preventDefault();
                cancelMomentum();
                
                const delta = e.deltaY * 1.5;
                const newScrollLeft = scrollContainer.scrollLeft + delta;
                
                scrollContainer.scrollLeft = Math.max(0, Math.min(newScrollLeft, scrollContainer.scrollWidth - scrollContainer.clientWidth));
                
                // Start momentum after wheel stops
                clearTimeout(scrollContainer.wheelTimeout);
                scrollContainer.wheelTimeout = setTimeout(() => {
                    velocity = e.deltaY * 0.5;
                    startMomentum();
                }, 100);
            }
        };
        
        // Mouse events
        scrollContainer.addEventListener('mousedown', (e) => {
            startDrag(e.pageX);
            e.preventDefault();
        });
        
        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                onDrag(e.pageX);
                e.preventDefault();
            }
        });
        
        window.addEventListener('mouseup', () => {
            if (isDragging) {
                stopDrag();
            }
        });
        
        // Touch events
        scrollContainer.addEventListener('touchstart', (e) => {
            startDrag(e.touches[0].pageX);
        }, { passive: false });
        
        scrollContainer.addEventListener('touchmove', (e) => {
            if (isDragging) {
                onDrag(e.touches[0].pageX);
                if (hasMoved) {
                    e.preventDefault();
                }
            }
        }, { passive: false });
        
        scrollContainer.addEventListener('touchend', () => {
            stopDrag();
        });
        
        // Wheel event
        scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
        
        // Prevent click on portfolio items if dragging occurred
        document.querySelectorAll('.portfolio-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (hasMoved) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, { capture: true });
        });
        
        // Clean up on mouse leave
        scrollContainer.addEventListener('mouseleave', () => {
            if (isDragging) {
                stopDrag();
            }
        });
    }

    // --- PORTFOLIO GSAP HORIZONTAL SCROLL (DESKTOP ONLY) ---
    if (window.innerWidth > 1024) {
        const sections = gsap.utils.toArray('.portfolio-item');
        if (sections.length) {
            gsap.to(sections, {
                xPercent: -100 * (sections.length - 1),
                ease: "none",
                scrollTrigger: {
                    trigger: ".portfolio-horizontal",
                    pin: true,
                    scrub: 1.2,
                    snap: {
                        snapTo: 1 / (sections.length - 1),
                        duration: 0.4,
                        ease: 'power2.out'
                    },
                    end: () => "+=" + (document.querySelector(".portfolio-horizontal").offsetWidth - window.innerWidth)
                }
            });
        }
    }

    // --- SECTION REVEALS ---
    gsap.from('.media-mask', {
        scale: 0.9, opacity: 0, duration: 1.5,
        scrollTrigger: { trigger: '.about', start: 'top 70%' }
    });

    gsap.to('.stat-circle-progress', {
        strokeDashoffset: 20, duration: 2,
        scrollTrigger: { trigger: '.about-stats-large', start: 'top 80%' }
    });

    gsap.from('.feature-card', {
        y: 50, opacity: 0, stagger: 0.12, duration: 0.8,
        scrollTrigger: { trigger: '.features-grid', start: 'top 85%' }
    });

    gsap.from('.portfolio-item', {
        x: 100, opacity: 0, stagger: 0.15, duration: 1,
        scrollTrigger: { trigger: '.portfolio-track', start: 'top 85%' }
    });

    // --- MENU TOGGLE ---
    const menuToggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('fullscreen-nav');
    const links = document.querySelectorAll('[data-link]');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            nav.classList.toggle('active');
            document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
            
            if (nav.classList.contains('active')) {
                gsap.from('.nav-col ul li', {
                    y: 30, opacity: 0, stagger: 0.08, duration: 0.6, ease: 'power3.out'
                });
            }
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

    // --- CUSTOM CURSOR ---
    if (window.matchMedia('(pointer: fine)').matches) {
        const cursorDot = document.querySelector('[data-cursor-dot]');
        const cursorOutline = document.querySelector('[data-cursor-outline]');
        
        if (cursorDot && cursorOutline) {
            let mouseX = 0, mouseY = 0;
            let dotX = 0, dotY = 0;
            let outlineX = 0, outlineY = 0;
            
            window.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
            });
            
            const animateCursor = () => {
                dotX += (mouseX - dotX) * 0.3;
                dotY += (mouseY - dotY) * 0.3;
                outlineX += (mouseX - outlineX) * 0.1;
                outlineY += (mouseY - outlineY) * 0.1;
                
                cursorDot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
                cursorOutline.style.transform = `translate(${outlineX}px, ${outlineY}px) translate(-50%, -50%)`;
                
                requestAnimationFrame(animateCursor);
            };
            animateCursor();
            
            const hoverElements = document.querySelectorAll('a, button, .portfolio-item, .feature-card, .menu-toggle');
            hoverElements.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    cursorOutline.style.width = '60px';
                    cursorOutline.style.height = '60px';
                    cursorOutline.style.borderColor = '#c9a96b';
                    cursorDot.style.opacity = '0';
                });
                el.addEventListener('mouseleave', () => {
                    cursorOutline.style.width = '48px';
                    cursorOutline.style.height = '48px';
                    cursorOutline.style.borderColor = 'rgba(201, 169, 107, 0.4)';
                    cursorDot.style.opacity = '1';
                });
            });
        }
    }

    // --- BACK TO TOP WITH PROGRESS ---
    const backBtn = document.getElementById('back-to-top');
    const progressCircle = document.querySelector('.progress-ring-circle');
    
    function updateBackToTopProgress(scrollY) {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? (scrollY / maxScroll) * 138.2 : 0;
        
        if (backBtn) {
            backBtn.classList.toggle('visible', scrollY > 600);
        }
        if (progressCircle) {
            progressCircle.style.strokeDashoffset = 138.2 - Math.min(progress, 138.2);
        }
    }
    
    window.addEventListener('scroll', () => {
        updateBackToTopProgress(window.scrollY);
    });
    
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (lenis) lenis.scrollTo(0);
            else window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- FORM HANDLING ---
    const form = document.getElementById('inquiry-form');
    const feedback = document.querySelector('.form-feedback');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name')?.value;
            const email = document.getElementById('email')?.value;
            const interest = document.getElementById('interest')?.value;
            
            if (name && email && interest) {
                feedback.innerHTML = '<span style="color: #c9a96b;">✓ Inquiry received. Our concierge will respond shortly.</span>';
                form.reset();
                gsap.fromTo(feedback, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 });
            } else {
                feedback.innerHTML = '<span style="color: #ff6b6b;">Please complete all required fields.</span>';
                gsap.fromTo(feedback, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.4 });
            }
        });
    }

    // --- VIDEO BUTTON ---
    document.querySelector('[data-video-trigger]')?.addEventListener('click', () => {
        alert('Brand film would play here.');
    });

    // --- SCROLL INDICATOR FADE ---
    gsap.to('.scroll-indicator', {
        opacity: 0,
        scrollTrigger: { trigger: '.hero', start: 'top top', end: '20% top', scrub: true }
    });

    // --- RESIZE HANDLER ---
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            ScrollTrigger.refresh();
            if (lenis) lenis.resize();
        }, 200);
    });

    // --- IMAGE ERROR FALLBACK ---
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function() {
            if (!this.src.includes('placehold.co')) {
                this.src = `https://placehold.co/600x800/1a1c22/c9a96b?text=Vertica`;
            }
        });
    });

}); // End DOMContentLoaded