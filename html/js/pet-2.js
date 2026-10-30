// Backend API URL
const API_URL = 'http://localhost:5000';

// Categories Configuration
const categories = [
    { id: 'all', title: 'Home', icon: 'fa-house', color: '#e0e7ff', iconColor: '#4338ca' },
    { id: 'cats', title: 'Cats', icon: 'fa-cat', color: '#fce7f3', iconColor: '#be185d' },
    { id: 'dogs', title: 'Dogs', icon: 'fa-dog', color: '#fef3c7', iconColor: '#b45309' },
    { id: 'birds', title: 'Birds', icon: 'fa-dove', color: '#dcfce7', iconColor: '#15803d' },
    { id: 'aquarium', title: 'Aquarium', icon: 'fa-fish', color: '#e0f2fe', iconColor: '#0369a1' },
    { id: 'food', title: 'Food', icon: 'fa-bowl-food', color: '#ffedd5', iconColor: '#c2410c' },
    { id: 'accessories', title: 'Accessories', icon: 'fa-bone', color: '#fae8ff', iconColor: '#a21caf' },
    { id: 'breeding', title: 'Breeding', icon: 'fa-heart', color: '#ffe4e6', iconColor: '#be123c' },
    { id: 'care', title: 'Care', icon: 'fa-pump-soap', color: '#ccfbf1', iconColor: '#0f766e' },
    { id: 'treatment', title: 'Treatment', icon: 'fa-kit-medical', color: '#fee2e2', iconColor: '#b91c1c' },
    { id: 'shelter', title: 'Shelter', icon: 'fa-shield-dog', color: '#f3e8ff', iconColor: '#6b21a8' }
];

let catalogItems = [];
let activeCategory = 'all';
let activeFilter = 'all';
let searchQuery = '';
let cart = [];

// Flexible DOM Element Selectors
const getGridContainer = () => document.getElementById('cards-grid') || document.getElementById('product-grid') || document.querySelector('.cards-grid');
const getTitleElement = () => document.getElementById('active-category-title') || document.querySelector('.section-header h2');
const getCategoriesContainer = () => document.getElementById('categories-container') || document.querySelector('.category');
const searchInput = document.getElementById('search-input');
const cartBtn = document.getElementById('cart-btn');
const cartCount = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const closeCartModal = document.getElementById('close-cart-modal');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const toast = document.getElementById('toast');

// Fetch Products from MySQL Node.js Backend with Smart Categorization & Images
async function fetchCatalogFromBackend() {
    try {
        const res = await fetch(`${API_URL}/products`);
        const data = await res.json();
        
        catalogItems = data.map(item => {
            const catLower = item.category.toLowerCase();
            let mappedCategory = 'accessories';
            let itemImg = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=400&q=80';

            if (catLower.includes('food')) {
                mappedCategory = 'food';
                itemImg = 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=400&q=80';
            } else if (catLower.includes('cat')) {
                mappedCategory = 'cats';
                itemImg = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80';
            } else if (catLower.includes('dog')) {
                mappedCategory = 'dogs';
                itemImg = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80';
            } else if (catLower.includes('bird')) {
                mappedCategory = 'birds';
                itemImg = 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=400&q=80';
            } else if (catLower.includes('aquarium')) {
                mappedCategory = 'aquarium';
                itemImg = 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=400&q=80';
            } else if (catLower.includes('breeding') || catLower.includes('shelter')) {
                mappedCategory = 'services_group';
                itemImg = 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=400&q=80';
            } else if (catLower.includes('treatment') || catLower.includes('care') || catLower.includes('vet')) {
                mappedCategory = 'veterinary_group';
                itemImg = 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=400&q=80';
            }

            return {
                id: item.id,
                category: mappedCategory,
                type: (mappedCategory === 'services_group' || mappedCategory === 'veterinary_group') ? 'service' : 'product',
                title: item.name,
                desc: `SKU: ${item.sku} | In Stock: ${item.quantity_in_stock} units`,
                price: Number(item.unit_price),
                img: itemImg
            };
        });

        renderCards();
    } catch (err) {
        console.error("Failed to connect to backend server:", err);
        const grid = getGridContainer();
        if (grid) {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 40px;">Cannot connect to backend server. Make sure node server.js is running!</p>`;
        }
    }
}

// Render Categories
function renderCategories() {
    const container = getCategoriesContainer();
    if (!container || !document.getElementById('categories-container')) return;
    
    container.innerHTML = categories.map(cat => `
        <div class="category-item ${cat.id === activeCategory ? 'active' : ''}" data-id="${cat.id}">
            <div class="category-item-inner">
                <div class="category-icon" style="background-color: ${cat.color}; color: ${cat.iconColor};">
                    <i class="fa-solid ${cat.icon}"></i>
                </div>
                <h3>${cat.title}</h3>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', () => {
            activeCategory = item.dataset.id;
            const categoryObj = categories.find(c => c.id === activeCategory);
            const titleEl = getTitleElement();
            if (titleEl) titleEl.textContent = categoryObj ? categoryObj.title : 'All Items';
            renderCategories();
            renderCards();
        });
    });
}

// Render Cards & Homepage About Section
function renderCards() {
    const grid = getGridContainer();
    if (!grid) return;

    const filtered = catalogItems.filter(item => {
        let matchesCategory = true;
        if (activeCategory === 'services_group') {
            matchesCategory = item.category === 'services_group';
        } else if (activeCategory === 'veterinary_group') {
            matchesCategory = item.category === 'veterinary_group';
        } else if (activeCategory !== 'all') {
            matchesCategory = item.category === activeCategory;
        }

        const matchesType = activeFilter === 'all' || item.type === activeFilter;
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              item.desc.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesType && matchesSearch;
    });

    let htmlOutput = '';

    if (filtered.length === 0) {
        htmlOutput = `<p style="grid-column: 1/-1; text-align: center; color: #6b7280; padding: 40px;">No items found matching your criteria.</p>`;
    } else {
        htmlOutput = filtered.map(item => `
            <div class="card">
                <img src="${item.img}" alt="${item.title}" class="card-img">
                <div class="card-body">
                    <span class="card-tag ${item.type === 'service' ? 'tag-service' : 'tag-product'}">${item.type}</span>
                    <h3 class="card-title">${item.title}</h3>
                    <p class="card-desc">${item.desc}</p>
                    <div class="card-footer">
                        <span class="card-price">₹${item.price.toFixed(2)}</span>
                        <button class="btn-primary" onclick="window.addToCart(${item.id})">
                            ${item.type === 'service' ? 'Book Now' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    if (activeCategory === 'all' && searchQuery === '') {
        htmlOutput += `
            <div style="grid-column: 1/-1; background: white; padding: 30px; border-radius: 16px; margin-top: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
                <h3 style="color: #7c3aed; font-size: 22px; margin-bottom: 12px;"><i class="fa-solid fa-heart"></i> Welcome to Poket Vet & Pet Shop</h3>
                <p style="color: #4b5563; line-height: 1.6; font-size: 15px;">
                    Poket Vet & Pet Shop is your trusted partner for all pet care requirements. From nutritious pet food and fun accessories to professional breeding advice, temporary shelter facilities, and qualified veterinary care, we bring high-quality pet management directly to your fingertips.
                </p>
            </div>
        `;
    }

    grid.innerHTML = htmlOutput;
}

// "About Me / About Us" Dedicated Information View
function renderAboutMeVisualization() {
    const titleEl = getTitleElement();
    if (titleEl) titleEl.textContent = "About Poket Vet & Pet Shop";

    const grid = getGridContainer();
    if (!grid) return;

    grid.innerHTML = `
        <div style="grid-column: 1/-1; background: white; padding: 35px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
            <h2 style="color: #7c3aed; font-size: 24px; margin-bottom: 15px;"><i class="fa-solid fa-store"></i> What Poket Vet & Pet Shop Provides</h2>
            <p style="color: #4b5563; line-height: 1.7; font-size: 15px; margin-bottom: 25px;">
                Poket Vet & Pet Shop is a modern, comprehensive platform designed to streamline pet care, nutrition, and medical services for pet parents and animal lovers alike.
            </p>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;">
                    <i class="fa-solid fa-cart-shopping" style="font-size: 28px; color: #7c3aed; margin-bottom: 10px;"></i>
                    <h3 style="font-size: 17px; font-weight: 700; margin-bottom: 6px;">1. Pet Supplies & Food</h3>
                    <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">Top-tier food, treats, toys, and essential accessories for cats, dogs, birds, and aquatic life.</p>
                </div>
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;">
                    <i class="fa-solid fa-hand-holding-heart" style="font-size: 28px; color: #047857; margin-bottom: 10px;"></i>
                    <h3 style="font-size: 17px; font-weight: 700; margin-bottom: 6px;">2. Breeding & Shelter</h3>
                    <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">Ethical breeding consultation, pet housing, adoption assistance, and temporary shelter services.</p>
                </div>
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;">
                    <i class="fa-solid fa-user-doctor" style="font-size: 28px; color: #b91c1c; margin-bottom: 10px;"></i>
                    <h3 style="font-size: 17px; font-weight: 700; margin-bottom: 6px;">3. Veterinary & Care</h3>
                    <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">Professional health checkups, vaccination schedules, grooming sessions, and specialized treatments.</p>
                </div>
            </div>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; border-left: 5px solid #7c3aed;">
                <h4 style="margin-bottom: 6px; font-size: 16px;">Our Core Commitment</h4>
                <p style="font-size: 14px; color: #4b5563; margin: 0;">We empower pet owners with easy online inventory ordering, real-time stock availability, and reliable pet services all under one roof.</p>
            </div>
        </div>
    `;
}

// Cart Management
window.addToCart = function(id) {
    const item = catalogItems.find(i => i.id === id);
    if (item) {
        cart.push(item);
        updateCartUI();
        showToast(`Added "${item.title}" to cart!`);
    }
};

function updateCartUI() {
    if (!cartCount) return;
    cartCount.textContent = cart.length;
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<p class="empty-msg">Your cart is empty.</p>`;
        cartTotal.textContent = '₹0.00';
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    cartTotal.textContent = `₹${total.toFixed(2)}`;

    cartItemsContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item-row">
            <div>
                <strong>${item.title}</strong>
                <div style="font-size: 12px; color: #6b7280;">₹${item.price.toFixed(2)}</div>
            </div>
            <button onclick="window.removeFromCart(${index})" style="border: none; background: none; color: #ef4444; cursor: pointer;">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
}

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCartUI();
};

function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Toggle Login / Logout UI State
function setLoggedInState(isLoggedIn, userName = '') {
    const navLogin = document.getElementById('nav-login');
    const navRegister = document.getElementById('nav-register');
    const navAdmin = document.getElementById('nav-admin');
    const navLogout = document.getElementById('nav-logout');

    if (isLoggedIn) {
        if (navLogin) navLogin.style.display = 'none';
        if (navRegister) navRegister.style.display = 'none';
        if (navAdmin) navAdmin.style.display = 'none';
        if (navLogout) navLogout.style.display = 'block';
        localStorage.setItem('loggedInUser', userName);
    } else {
        if (navLogin) navLogin.style.display = 'block';
        if (navRegister) navRegister.style.display = 'block';
        if (navAdmin) navAdmin.style.display = 'block';
        if (navLogout) navLogout.style.display = 'none';
        localStorage.removeItem('loggedInUser');
    }
}

// Setup Event Listeners & Navbar Routing
function setupEventListeners() {
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderCards();
        });
    }

    // Checkout Handler with Authentication Check
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert("Your cart is empty!");
                return;
            }

            const isLoggedIn = localStorage.getItem('loggedInUser');

            if (!isLoggedIn) {
                // If not logged in: Close cart, prompt toast, and open login modal
                if (cartModal) cartModal.classList.remove('active');
                showToast("Please login to complete your checkout.");
                const loginModal = document.getElementById('login-modal');
                if (loginModal) loginModal.classList.add('active');
            } else {
                // If logged in: Clear cart, notify user, close modal, and return to Home
                cart = [];
                updateCartUI();
                if (cartModal) cartModal.classList.remove('active');
                showToast("Order placed successfully! Redirecting to home...");
                
                // Return to Home View
                activeCategory = 'all';
                activeFilter = 'all';
                const titleEl = getTitleElement();
                if (titleEl) titleEl.textContent = "All Categories";
                
                const navLinks = document.querySelectorAll('header ul.nav li a');
                navLinks.forEach(l => l.classList.remove('active'));
                const homeLink = document.querySelector('header ul.nav li a[href="#home"]');
                if (homeLink) homeLink.classList.add('active');

                renderCategories();
                renderCards();
            }
        });
    }

    // Logout Button Handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            setLoggedInState(false);
            showToast("Logged out successfully.");
        });
    }

    // Login Modal Toggles & Form Logic
    const loginModal = document.getElementById('login-modal');
    const openLoginModal = document.getElementById('open-login-modal');
    const closeLoginModal = document.getElementById('close-login-modal');

    if (openLoginModal && loginModal && closeLoginModal) {
        openLoginModal.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.classList.add('active');
        });
        closeLoginModal.addEventListener('click', () => loginModal.classList.remove('active'));
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const credentials = {
                email: document.getElementById('login-email').value,
                password: document.getElementById('login-password').value
            };

            try {
                const res = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(credentials)
                });
                const data = await res.json();
                if (res.ok) {
                    loginForm.reset();
                    loginModal.classList.remove('active');
                    showToast(`Welcome back, ${data.user.name}!`);
                    setLoggedInState(true, data.user.name);
                } else {
                    alert(data.error || "Login failed");
                }
            } catch (err) {
                console.error("Login error:", err);
            }
        });
    }

    // Register Modal Toggles & Form Logic
    const registerModal = document.getElementById('register-modal');
    const openRegisterModal = document.getElementById('open-register-modal');
    const closeRegisterModal = document.getElementById('close-register-modal');

    if (openRegisterModal && registerModal && closeRegisterModal) {
        openRegisterModal.addEventListener('click', (e) => {
            e.preventDefault();
            registerModal.classList.add('active');
        });
        closeRegisterModal.addEventListener('click', () => registerModal.classList.remove('active'));
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newUser = {
                name: document.getElementById('reg-name').value,
                email: document.getElementById('reg-email').value,
                password: document.getElementById('reg-password').value
            };

            try {
                const res = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newUser)
                });
                const data = await res.json();
                if (res.ok) {
                    registerForm.reset();
                    registerModal.classList.remove('active');
                    showToast("Account created successfully! You can now log in.");
                } else {
                    alert(data.error || "Registration failed");
                }
            } catch (err) {
                console.error("Registration error:", err);
            }
        });
    }

    // Navbar Tab Routing
    const navLinks = document.querySelectorAll('header ul.nav li a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetHref = link.getAttribute('href');
            e.preventDefault();

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const titleEl = getTitleElement();

            if (targetHref === '#about') {
                renderAboutMeVisualization();
                return;
            }

            if (targetHref === '#shop') {
                activeCategory = 'all';
                activeFilter = 'product';
                if (titleEl) titleEl.textContent = "Shop Catalog";
            } else if (targetHref === '#services') {
                activeCategory = 'services_group';
                activeFilter = 'all';
                if (titleEl) titleEl.textContent = "Pet Services (Breeding & Shelter)";
            } else if (targetHref === '#veterinary') {
                activeCategory = 'veterinary_group';
                activeFilter = 'all';
                if (titleEl) titleEl.textContent = "Veterinary Care & Treatments";
            } else if (targetHref === '#home') {
                activeCategory = 'all';
                activeFilter = 'all';
                if (titleEl) titleEl.textContent = "All Categories";
            }
            
            renderCategories();
            renderCards();
        });
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.type;
            renderCards();
        });
    });

    if (cartBtn && cartModal && closeCartModal) {
        cartBtn.addEventListener('click', () => cartModal.classList.add('active'));
        closeCartModal.addEventListener('click', () => cartModal.classList.remove('active'));
    }

    // Admin Modal Toggles
    const adminModal = document.getElementById('admin-modal');
    const openAdminModal = document.getElementById('open-admin-modal');
    const closeAdminModal = document.getElementById('close-admin-modal');

    if (openAdminModal && adminModal && closeAdminModal) {
        openAdminModal.addEventListener('click', (e) => {
            e.preventDefault();
            adminModal.classList.add('active');
        });
        closeAdminModal.addEventListener('click', () => {
            adminModal.classList.remove('active');
        });
    }

    // Handle Add Product Form submission to MySQL Backend
    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newProduct = {
                sku: document.getElementById('sku').value,
                name: document.getElementById('name').value,
                category: document.getElementById('category').value,
                quantity_in_stock: document.getElementById('quantity').value,
                reorder_threshold: document.getElementById('threshold').value,
                unit_price: document.getElementById('price').value
            };

            try {
                const res = await fetch(`${API_URL}/products`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newProduct)
                });

                if (res.ok) {
                    addProductForm.reset();
                    if (adminModal) adminModal.classList.remove('active');
                    showToast("Product successfully saved to MySQL database!");
                    fetchCatalogFromBackend();
                } else {
                    const errData = await res.json();
                    alert(errData.error || "Failed to add product");
                }
            } catch (err) {
                console.error("Error saving product:", err);
            }
        });
    }
}

// Initialize Application on Load
document.addEventListener('DOMContentLoaded', () => {
    renderCategories();
    setupEventListeners();
    fetchCatalogFromBackend();

    // Preserve login state across page reloads
    const savedUser = localStorage.getItem('loggedInUser');
    if (savedUser) {
        setLoggedInState(true, savedUser);
    }
});