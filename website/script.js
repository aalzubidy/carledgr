// Global translations object - will be loaded from JSON file
let translations = {};
let config = {};

// Load configuration
async function loadConfig() {
    try {
        console.log('Loading configuration...');
        const response = await fetch('config.json');
        config = await response.json();
        console.log('Configuration loaded:', config);
    } catch (error) {
        console.error('Error loading configuration:', error);
        // Fallback configuration
        config = {
            api: {
                baseUrl: 'http://localhost:5000/api',
                endpoints: {
                    plans: '/subscriptions/plans',
                    checkout: '/subscriptions/checkout'
                }
            },
            app: {
                successUrl: 'https://carledgr.com/success.html',
                cancelUrl: 'https://carledgr.com/cancel.html',
                demoUrl: 'https://demo.carledgr.com'
            }
        };
    }
}

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

// Stripe Checkout Functions
async function startCheckoutProcess(planName, button, originalText) {
    try {
        // Map plan names to the backend plan identifiers
        const planMapping = {
            'Starter': 'starter',
            'Professional': 'professional', 
            'Business': 'business',
            'Enterprise': 'enterprise'
        };
        
        const planId = planMapping[planName];
        if (!planId) {
            throw new Error(`Unknown plan: ${planName}`);
        }
        
        // Show organization name modal
        const orgData = await showOrganizationModal(planName);
        if (!orgData) {
            // User cancelled
            resetButton(button, originalText);
            return;
        }
        
        // Get available plans from backend to get the correct price ID
        const plans = await fetchAvailablePlans();
        const selectedPlan = plans.find(p => p.id === planId);
        
        if (!selectedPlan) {
            throw new Error(`Plan not found: ${planId}`);
        }
        
        // Create checkout session
        const checkoutData = {
            price_id: selectedPlan.stripe_price_id,
            organization_name: orgData.organizationName,
            owner_email: orgData.ownerEmail,
            success_url: config.app.successUrl,
            cancel_url: config.app.cancelUrl
        };
        
        const session = await createCheckoutSession(checkoutData);
        
        // Redirect to Stripe Checkout
        window.location.href = session.checkout_url;
        
    } catch (error) {
        console.error('Checkout error:', error);
        resetButton(button, originalText);
        showErrorMessage(`Sorry, there was an error starting the checkout process: ${error.message}`);
    }
}

async function fetchAvailablePlans() {
    const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.plans}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch plans: ${response.status}`);
    }
    return await response.json();
}

async function createCheckoutSession(checkoutData) {
    const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.checkout}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(checkoutData)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
}

function showOrganizationModal(planName) {
    return new Promise((resolve) => {
        // Create modal HTML
        const modalHTML = `
            <div id="org-modal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
            ">
                <div style="
                    background: white;
                    border-radius: 12px;
                    padding: 2.5rem;
                    max-width: 500px;
                    width: 100%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                ">
                    <h2 style="margin: 0 0 1rem 0; color: #1a1a1a; font-size: 1.8rem;">
                        Complete Your ${planName} Plan Purchase
                    </h2>
                    <p style="color: #666; margin-bottom: 2rem; line-height: 1.6;">
                        Please provide your business information to set up your CarLedgr account.
                    </p>
                    
                    <form id="org-form">
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">
                                Business/Organization Name *
                            </label>
                            <input type="text" id="org-name" required style="
                                width: 100%;
                                padding: 0.75rem;
                                border: 2px solid #e5e7eb;
                                border-radius: 8px;
                                font-size: 1rem;
                                box-sizing: border-box;
                            " placeholder="ABC Auto Dealership">
                        </div>
                        
                        <div style="margin-bottom: 2rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">
                                Owner Email Address *
                            </label>
                            <input type="email" id="owner-email" required style="
                                width: 100%;
                                padding: 0.75rem;
                                border: 2px solid #e5e7eb;
                                border-radius: 8px;
                                font-size: 1rem;
                                box-sizing: border-box;
                            " placeholder="owner@abcauto.com">
                            <small style="color: #6b7280; margin-top: 0.25rem; display: block;">
                                We'll send your login credentials to this email address
                            </small>
                        </div>
                        
                        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                            <button type="button" id="modal-cancel" style="
                                padding: 0.75rem 1.5rem;
                                border: 2px solid #e5e7eb;
                                background: white;
                                color: #374151;
                                border-radius: 8px;
                                font-weight: 500;
                                cursor: pointer;
                                font-size: 1rem;
                            ">Cancel</button>
                            <button type="submit" style="
                                padding: 0.75rem 1.5rem;
                                background: #2563eb;
                                color: white;
                                border: none;
                                border-radius: 8px;
                                font-weight: 500;
                                cursor: pointer;
                                font-size: 1rem;
                            ">Continue to Payment</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('org-modal');
        const form = document.getElementById('org-form');
        const cancelBtn = document.getElementById('modal-cancel');
        
        // Focus first input
        document.getElementById('org-name').focus();
        
        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const organizationName = document.getElementById('org-name').value.trim();
            const ownerEmail = document.getElementById('owner-email').value.trim();
            
            if (!organizationName || !ownerEmail) {
                showErrorMessage('Please fill in all required fields');
                return;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(ownerEmail)) {
                showErrorMessage('Please enter a valid email address');
                return;
            }
            
            modal.remove();
            resolve({ organizationName, ownerEmail });
        });
        
        // Handle cancel
        cancelBtn.addEventListener('click', () => {
            modal.remove();
            resolve(null);
        });
        
        // Handle escape key
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escapeHandler);
                resolve(null);
            }
        });
        
        // Handle click outside modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(null);
            }
        });
    });
}

function resetButton(button, originalText) {
    button.textContent = originalText;
    button.disabled = false;
}

function showErrorMessage(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 10001;
        max-width: 400px;
        font-weight: 500;
        animation: slideInRight 0.3s ease-out;
    `;
    errorDiv.textContent = message;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        errorDiv.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 300);
    }, 5000);
    
    // Click to dismiss
    errorDiv.addEventListener('click', () => {
        errorDiv.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 300);
    });
}

// Consolidated DOMContentLoaded event handler
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    // 1. Load configuration and translations
    Promise.all([loadConfig(), loadTranslations()]);
    
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
    
    // 4. Set up pricing plan selection with Stripe checkout
    const pricingButtons = document.querySelectorAll('.pricing-card .btn');
    pricingButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const planCard = this.closest('.pricing-card');
            const planName = planCard.querySelector('h3').textContent.trim();
            
            // Show loading state
            const originalText = this.textContent;
            this.textContent = 'Loading...';
            this.disabled = true;
            
            // Start checkout process
            startCheckoutProcess(planName, this, originalText);
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