// Global translations object - will be loaded from JSON file
let translations = {};

// Load translations from JSON file
async function loadTranslations() {
    try {
        console.log('Loading translations...');
        const response = await fetch('translations.json');
        translations = await response.json();
        console.log('Translations loaded:', Object.keys(translations).length, 'keys');
        
        // Initialize language after translations are loaded
        const savedLanguage = localStorage.getItem('carledgr-language') || 'en';
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = savedLanguage;
            updateLanguage(savedLanguage);
        }
    } catch (error) {
        console.error('Error loading translations:', error);
        // Fallback - keep English text as is
    }
}

// Language switcher functionality
function updateLanguage(lang) {
    console.log('Updating language to:', lang);
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[key] && translations[key][lang]) {
            if (element.innerHTML.includes('<span class="highlight">')) {
                element.innerHTML = translations[key][lang];
            } else {
                element.textContent = translations[key][lang];
            }
        }
    });
    
    // Save language preference
    localStorage.setItem('carledgr-language', lang);
}

// Mobile Navigation Toggle
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInsideNav = navMenu.contains(event.target) || navToggle.contains(event.target);
        if (!isClickInsideNav && navMenu.classList.contains('active')) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Navbar background on scroll
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationDelay = '0.1s';
            entry.target.style.animationFillMode = 'both';
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Add CSS animation class
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        animation: fadeInUp 0.6s ease-out forwards;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Form handling (if you add contact forms later)
function handleFormSubmit(event) {
    event.preventDefault();
    // Add form submission logic here
    console.log('Form submitted');
}

// Add loading state to buttons
function addLoadingState(button) {
    const originalText = button.textContent;
    button.textContent = 'Loading...';
    button.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 2000);
}

// Consolidated DOMContentLoaded event handler
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    // 1. Load translations first
    loadTranslations();
    
    // 2. Set up language selector
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            const selectedLanguage = this.value;
            updateLanguage(selectedLanguage);
        });
    }
    
    // 3. Set up animation observer
    const animateElements = document.querySelectorAll('.feature-card, .pricing-card');
    animateElements.forEach(el => {
        observer.observe(el);
    });
    
    // 4. Set up pricing plan selection
    const pricingButtons = document.querySelectorAll('.pricing-card .btn');
    pricingButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const planName = this.closest('.pricing-card').querySelector('h3').textContent;
            
            // Here you would typically redirect to a signup page or open a modal
            console.log(`Selected plan: ${planName}`);
            
            // For demo purposes, show an alert
            alert(`You selected the ${planName} plan. This would normally redirect to a signup page.`);
        });
    });
    
    // 5. Handle CTA button clicks - Let demo buttons navigate naturally
    const demoButtons = document.querySelectorAll('.hero .btn-primary, .cta .btn-primary, .nav-demo-btn');
    demoButtons.forEach(button => {
        // Check if this is actually a demo button (has demo URL)
        if (button.href && button.href.includes('demo.carledgr.com')) {
            // Let demo buttons navigate naturally - no preventDefault
            button.addEventListener('click', function(e) {
                addLoadingState(this);
                // Don't prevent default - allow natural navigation to demo
            });
        } else {
            // For other buttons that don't have demo URLs, show placeholder
            button.addEventListener('click', function(e) {
                e.preventDefault();
                addLoadingState(this);
                
                setTimeout(() => {
                    alert('This would normally redirect to a signup page or contact form.');
                }, 2000);
            });
        }
    });
    
    // 6. Add hover effects to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-4px)';
        });
    });
    
    // 7. Add click effect to homepage screenshot
    const homepageScreenshot = document.querySelector('.homepage-screenshot');
    if (homepageScreenshot) {
        homepageScreenshot.addEventListener('click', function() {
            this.style.transform = 'scale(1.05)';
            setTimeout(() => {
                this.style.transform = 'scale(1.02)';
            }, 200);
        });
    }
    
    // 8. Create scroll progress indicator
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #2563eb, #1d4ed8);
        z-index: 9999;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);
    
    // 9. Update progress on scroll
    window.addEventListener('scroll', function() {
        const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        progressBar.style.width = scrolled + '%';
    });
}); 