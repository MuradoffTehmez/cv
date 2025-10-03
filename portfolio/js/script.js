// Mobile menu toggle
const mobileMenu = document.getElementById('mobile-menu');
const navMenu = document.getElementById('nav-menu');

mobileMenu.addEventListener('click', function() {
    mobileMenu.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Update active link based on current page
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage || 
            (currentPage === '' && link.getAttribute('href') === 'index.html')) {
            // Remove active class from all links first
            document.querySelectorAll('.nav-link').forEach(item => {
                item.classList.remove('active');
            });
            // Add active class to current link
            link.classList.add('active');
        }
    });
});

// Login form submission
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Simple validation
            if(username === 'admin' && password === 'password') {
                alert('Giriş uğurludur! Xoş gəldiniz, ' + username + '!');
                // In a real application, redirect to a user dashboard
                // window.location.href = 'dashboard.html';
            } else {
                alert('Yanlış istifadəçi adı və ya şifrə!');
            }
        });
    }
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        const mobileMenu = document.getElementById('mobile-menu');
        const navMenu = document.getElementById('nav-menu');
        
        if(mobileMenu && navMenu) {
            mobileMenu.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
});

// Password toggle functionality for register page
document.addEventListener('DOMContentLoaded', function() {
    const toggleRegPassword = document.getElementById('toggleRegPassword');
    const toggleRegConfirmPassword = document.getElementById('toggleRegConfirmPassword');
    
    if(toggleRegPassword) {
        toggleRegPassword.addEventListener('click', function() {
            const passwordField = document.getElementById('regPassword');
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                this.textContent = '👁️‍🗨️';
            } else {
                passwordField.type = 'password';
                this.textContent = '👁️';
            }
        });
    }
    
    if(toggleRegConfirmPassword) {
        toggleRegConfirmPassword.addEventListener('click', function() {
            const passwordField = document.getElementById('regConfirmPassword');
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                this.textContent = '👁️‍🗨️';
            } else {
                passwordField.type = 'password';
                this.textContent = '👁️';
            }
        });
    }
});

// Əlavə naviqasiya funksiyaları
document.addEventListener('DOMContentLoaded', function() {
    // Çıxış linki əlavə et
    const navContainer = document.querySelector('.nav-container');
    if (navContainer && !document.querySelector('a[href="#logout"]')) {
        const logoutLink = document.createElement('a');
        logoutLink.href = '#logout';
        logoutLink.className = 'nav-link';
        logoutLink.textContent = 'Çıxış';
        logoutLink.style.display = 'none'; // Varsayılan olaraq gizli
        
        // Onu ən sona əlavə et
        navContainer.querySelector('.nav-menu').appendChild(logoutLink);
    }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 70,
                behavior: 'smooth'
            });
        }
    });
});