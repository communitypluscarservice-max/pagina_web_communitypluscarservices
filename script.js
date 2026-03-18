document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initLanguageSwitcher();
    initColorExtraction();
    initScrollAnimations();
    initHeroSlider();
    initFAQAccordion();
});

// --- NAVIGATION & MOBILE MENU ---
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link, .nav-btn');
    const navbar = document.getElementById('navbar');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');

        // Prevent body scroll when menu is open
        if (navMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    });

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Navbar & Progress Bar scroll effect
    window.addEventListener('scroll', () => {
        // Navbar Scrolled State
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Scroll Progress Bar Update
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            progressBar.style.width = scrolled + "%";
        }
    });

    // Trigger once on load
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    }
}

// --- FAQ ACCORDION ---
function initFAQAccordion() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const accordionItem = header.parentElement;

            // Close previously opened items
            const activeItems = document.querySelectorAll('.accordion-item.active');
            activeItems.forEach(item => {
                if (item !== accordionItem) {
                    item.classList.remove('active');
                }
            });

            // Toggle current item
            accordionItem.classList.toggle('active');
        });
    });
}

// --- LANGUAGE SWITCHER ---
function initLanguageSwitcher() {
    const langBtn = document.getElementById('lang-toggle');
    const currentLangSpan = document.getElementById('current-lang');

    // Check local storage or default to EN
    let currentLang = localStorage.getItem('language') || 'en';

    // Apply initial language
    applyLanguage(currentLang);
    updateLangUI(currentLang);

    langBtn.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'es' : 'en';
        localStorage.setItem('language', currentLang);
        applyLanguage(currentLang);
        updateLangUI(currentLang);
    });

    function applyLanguage(lang) {
        // Find all elements with data-en and data-es
        const translatableElements = document.querySelectorAll('[data-en][data-es]');

        translatableElements.forEach(el => {
            if (lang === 'en') {
                el.textContent = el.getAttribute('data-en');
            } else {
                el.textContent = el.getAttribute('data-es');
            }
        });

        // Also update the HTML lang attribute for accessibility
        document.documentElement.lang = lang;
    }

    function updateLangUI(lang) {
        currentLangSpan.textContent = lang === 'en' ? 'EN' : 'ES';
    }
}

// --- SCROLL ANIMATIONS ---
function initScrollAnimations() {
    // Add reveal class to sections, cards, and titles dynamically
    const revealElements = document.querySelectorAll('section > .container > div, section > .container > h2, section > .container > p');

    revealElements.forEach(el => {
        if (!el.classList.contains('hero-content')) {
            el.classList.add('reveal');
        }
    });

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    document.querySelectorAll('.reveal').forEach(el => {
        revealObserver.observe(el);
    });
}

// --- DYNAMIC COLOR EXTRACTION (CANVAS API) ---
function initColorExtraction() {
    const logoImg = document.getElementById('main-logo');

    // Wait for the image to fully load
    if (logoImg.complete) {
        extractColors(logoImg);
    } else {
        logoImg.addEventListener('load', () => {
            extractColors(logoImg);
        });

        // Error handling if logo fails to load
        logoImg.addEventListener('error', () => {
            console.warn('Logo image failed to load for color extraction. Using fallback variables.');
        });
    }
}

function extractColors(imgElement) {
    try {
        const canvas = document.getElementById('color-extractor-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        canvas.width = imgElement.width || imgElement.naturalWidth;
        canvas.height = imgElement.height || imgElement.naturalHeight;

        if (canvas.width === 0 || canvas.height === 0) return;

        // Draw image on canvas
        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

        // Get Pixel Data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const colorCounts = {};
        let maxCount1 = 0;
        let dominantColor1 = '';
        let maxCount2 = 0;
        let dominantColor2 = '';

        for (let i = 0; i < data.length; i += 16) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a < 128) continue;

            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            if (brightness > 240 || brightness < 20) continue;

            // Group close colors
            const rKey = Math.floor(r / 20) * 20;
            const gKey = Math.floor(g / 20) * 20;
            const bKey = Math.floor(b / 20) * 20;
            const rgb = `${rKey},${gKey},${bKey}`;

            colorCounts[rgb] = (colorCounts[rgb] || 0) + 1;
        }

        for (const color in colorCounts) {
            if (colorCounts[color] > maxCount1) {
                maxCount2 = maxCount1;
                dominantColor2 = dominantColor1;

                maxCount1 = colorCounts[color];
                dominantColor1 = color;
            } else if (colorCounts[color] > maxCount2 && isColorDifferent(dominantColor1, color)) {
                maxCount2 = colorCounts[color];
                dominantColor2 = color;
            }
        }

        // Apply colors to root CSS variables and generate gradients
        if (dominantColor1) {
            const rgb1 = dominantColor1.replace(/,/g, ', ');
            document.documentElement.style.setProperty('--primary-color', `rgb(${rgb1})`);

            if (dominantColor2) {
                // The user requested orange buttons. We are disabling the extraction of the secondary color (green)
                // from the logo so it falls back to the default orange `--accent-color` and `--gradient-accent` in CSS.
                // const rgb2 = dominantColor2.replace(/,/g, ', ');
                // document.documentElement.style.setProperty('--accent-color', `rgb(${rgb2})`);
                // document.documentElement.style.setProperty('--gradient-accent', `linear-gradient(135deg, rgb(${rgb2}) 0%, #f97316 100%)`);
            }
        }
    } catch (error) {
        console.warn('Canvas color extraction failed. Using CSS root fallbacks.', error);
    }
}

function isColorDifferent(col1, col2) {
    if (!col1 || !col2) return true;
    const c1 = col1.split(',').map(Number);
    const c2 = col2.split(',').map(Number);

    const dist = Math.sqrt(
        Math.pow(c1[0] - c2[0], 2) +
        Math.pow(c1[1] - c2[1], 2) +
        Math.pow(c1[2] - c2[2], 2)
    );

    return dist > 60;
}

// --- HERO SLIDER ANIMATION ---
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-bg.slide');
    const contents = document.querySelectorAll('.hero-content');
    if (slides.length === 0) return;

    let currentSlide = 0;

    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        if (contents[currentSlide]) {
            contents[currentSlide].classList.remove('active');
        }
        
        currentSlide = (currentSlide + 1) % slides.length;
        
        slides[currentSlide].classList.add('active');
        if (contents[currentSlide]) {
            contents[currentSlide].classList.add('active');
        }
    }, 5000); // Change every 5 seconds
}