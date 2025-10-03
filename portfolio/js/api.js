// API əlaqə funksiyaları
const API_BASE_URL = 'http://localhost:5001/api';

// Toast funksiyaları
const showToast = (message, type = 'success') => {
    // Əgər toastify yüklənməyibsə, sadəcə alert göstər
    if (typeof Toastify === 'undefined') {
        alert(message);
        return;
    }
    
    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top", // yuxarı mövqe
        position: "right", // sağ mövqe
        backgroundColor: type === 'success' ? "#4CAF50" : "#f44336", // uğurlu/xəta rəngi
        stopOnFocus: true, // kursor toxunanda dayansın
    }).showToast();
};

// Ümumi headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

// Giriş sistemi funksiyaları
const authAPI = {
    // Qeydiyyat
    register: async (username, email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            return data;
        } catch (error) {
            console.error('Qeydiyyat xətası:', error);
            return { success: false, message: 'Serverə əlaqə xətası' };
        }
    },

    // Giriş
    login: async (username, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            return data;
        } catch (error) {
            console.error('Giriş xətası:', error);
            return { success: false, message: 'Serverə əlaqə xətası' };
        }
    },

    // Cari istifadəçini əldə et
    getMe: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            return data;
        } catch (error) {
            console.error('İstifadəçi məlumatı xətası:', error);
            return { success: false, message: 'Serverə əlaqə xətası' };
        }
    },

    // Çıxış
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};

// Layihələr funksiyaları
const projectsAPI = {
    // Bütün layihələri əldə et (giriş tələb olunmur)
    getAll: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/projects`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Layihələr əldə etmə xətası:', error);
            return { success: false, message: 'Serverə əlaqə xətası' };
        }
    },

    // Ana səhifə məlumatlarını əldə et
    getHomepageData: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/homepage`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Ana səhifə məlumatı xətası:', error);
            return { success: false, message: 'Serverə əlaqə xətası' };
        }
    }
};

// İstifadəçi funksiyaları
const userAPI = {
    // Profil məlumatlarını əldə et
    getProfile: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/user/profile`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Profil məlumatı xətası:', error);
            return { success: false, message: 'Serverə əlaqə xətası' };
        }
    },

    // Profil məlumatlarını yenilə
    updateProfile: async (profileData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/user/profile`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ profile: profileData })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Profil yeniləmə xətası:', error);
            return { success: false, message: 'Serverə əlaqə xətası' };
        }
    },

    // Şifrəni dəyiş
    changePassword: async (currentPassword, newPassword) => {
        try {
            const response = await fetch(`${API_BASE_URL}/user/changepassword`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword
                })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Şifrə dəyişmə xətası:', error);
            return { success: false, message: 'Serverə əlaqə xətası' };
        }
    },

    // Profil şəklini yüklə
    uploadAvatar: async (file) => {
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/user/avatar`, {
                method: 'PUT',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: formData
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Profil şəkli yükləmə xətası:', error);
            return { success: false, message: 'Serverə əlaqə xətası' };
        }
    }
};

// Admin funksiyaları
const adminAPI = {
    // Bütün istifadəçiləri əldə et
    getAllUsers: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('İstifadəçilər əldə etmə xətası:', error);
            return { success: false, message: 'Serverə əlaqə xətası' };
        }
    },

    // Bütün layihələri əldə et
    getAllProjects: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/projects`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Layihələr əldə etmə xətası:', error);
            return { success: false, message: 'Serverə əlaqə xətası' };
        }
    }
};

// Bloq məqalələri funksiyaları
const postsAPI = {
    // Bütün məqalələri əldə et
    getAll: async (page = 1, limit = 10) => {
        try {
            const response = await fetch(`${API_BASE_URL}/posts?page=${page}&limit=${limit}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Məqalələr əldə etmə xətası:', error);
            return { success: false, message: 'Serverə əlaqə xətası' };
        }
    },

    // Məqaləni slug ilə əldə et
    getBySlug: async (slug) => {
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${slug}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Məqalə əldə etmə xətası:', error);
            return { success: false, message: 'Serverə əlaqə xətası' };
        }
    },

    // Yeni məqalə yarat (admin only)
    create: async (postData) => {
        try {
            const formData = new FormData();
            formData.append('title', postData.title);
            formData.append('content', postData.content);
            formData.append('excerpt', postData.excerpt);
            formData.append('status', postData.status);
            
            if (postData.featured_image) {
                formData.append('featured_image', postData.featured_image);
            }
            
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: formData
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Məqalə yaratma xətası:', error);
            return { success: false, message: 'Serverə əlaqə xətası' };
        }
    },

    // Məqaləni redaktə et (admin only)
    update: async (id, postData) => {
        try {
            const formData = new FormData();
            formData.append('title', postData.title);
            formData.append('content', postData.content);
            formData.append('excerpt', postData.excerpt);
            formData.append('status', postData.status);
            
            if (postData.featured_image) {
                formData.append('featured_image', postData.featured_image);
            }
            
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
                method: 'PUT',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: formData
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Məqalə redaktə etmə xətası:', error);
            return { success: false, message: 'Serverə əlaqə xətası' };
        }
    },

    // Məqaləni sil (admin only)
    delete: async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Məqalə silmə xətası:', error);
            return { success: false, message: 'Serverə əlaqə xətası' };
        }
    }
};

// Rəy funksiyaları
const commentsAPI = {
    // Məqaləyə rəy əlavə et
    addComment: async (postId, content) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ content })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Rəy əlavə etmə xətası:', error);
            return { success: false, message: 'Serverə əlaqə xətası' };
        }
    }
};

// Layihə ətraflı funksiyaları
const projectDetailAPI = {
    // Layihəni ID ilə əldə et
    getById: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/projects/${id}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Layihə əldə etmə xətası:', error);
            return { success: false, message: 'Serverə əlaqə xətası' };
        }
    }
};

// Frontend funksiyaları
const frontend = {
    // Email formatını yoxla
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Login form təqdimatı
    initLogin: () => {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            // Real-time validation
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            
            usernameInput.addEventListener('input', () => {
                if (usernameInput.value.trim() === '') {
                    usernameInput.setCustomValidity('İstifadəçi adı boş ola bilməz');
                } else {
                    usernameInput.setCustomValidity('');
                }
            });
            
            passwordInput.addEventListener('input', () => {
                if (passwordInput.value.length < 6) {
                    passwordInput.setCustomValidity('Şifrə ən azı 6 simvol uzunluğunda olmalıdır');
                } else {
                    passwordInput.setCustomValidity('');
                }
            });
            
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Form validation
                const username = usernameInput.value.trim();
                const password = passwordInput.value;
                
                if (username === '') {
                    showToast('İstifadəçi adı boş ola bilməz!', 'error');
                    return;
                }
                
                if (password.length < 6) {
                    showToast('Şifrə ən azı 6 simvol uzunluğunda olmalıdır!', 'error');
                    return;
                }
                
                // Loading indicator əlavə et
                const loginButton = document.querySelector('#loginForm button[type="submit"]');
                const originalText = loginButton.textContent;
                loginButton.innerHTML = '<span class="spinner"></span> Giriş edilir...';
                loginButton.disabled = true;
                
                try {
                    const result = await authAPI.login(username, password);
                    if (result.success) {
                        showToast('Giriş uğurludur!', 'success');
                        setTimeout(() => {
                            window.location.href = 'profile.html';
                        }, 1500);
                    } else {
                        showToast(result.message, 'error');
                    }
                } catch (error) {
                    showToast('Serverə əlaqə xətası: ' + error.message, 'error');
                } finally {
                    // Loading indicator-u sil
                    loginButton.innerHTML = originalText;
                    loginButton.disabled = false;
                }
            });
        }
    },

    // Register form təqdimatı
    initRegister: () => {
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            // Real-time validation
            const usernameInput = document.getElementById('regUsername');
            const emailInput = document.getElementById('regEmail');
            const passwordInput = document.getElementById('regPassword');
            const confirmPasswordInput = document.getElementById('regConfirmPassword');
            
            usernameInput.addEventListener('input', () => {
                if (usernameInput.value.trim() === '') {
                    usernameInput.setCustomValidity('İstifadəçi adı boş ola bilməz');
                } else if (usernameInput.value.length < 3) {
                    usernameInput.setCustomValidity('İstifadəçi adı ən azı 3 simvol uzunluğunda olmalıdır');
                } else {
                    usernameInput.setCustomValidity('');
                }
            });
            
            emailInput.addEventListener('input', () => {
                if (emailInput.value.trim() === '') {
                    emailInput.setCustomValidity('Email boş ola bilməz');
                } else if (!frontend.isValidEmail(emailInput.value)) {
                    emailInput.setCustomValidity('Düzgün email formatı daxil edin');
                } else {
                    emailInput.setCustomValidity('');
                }
            });
            
            passwordInput.addEventListener('input', () => {
                if (passwordInput.value.length < 6) {
                    passwordInput.setCustomValidity('Şifrə ən azı 6 simvol uzunluğunda olmalıdır');
                } else {
                    passwordInput.setCustomValidity('');
                }
            });
            
            confirmPasswordInput.addEventListener('input', () => {
                if (confirmPasswordInput.value !== passwordInput.value) {
                    confirmPasswordInput.setCustomValidity('Şifrələr uyğun gəlmir');
                } else {
                    confirmPasswordInput.setCustomValidity('');
                }
            });
            
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Form validation
                const username = usernameInput.value.trim();
                const email = emailInput.value.trim();
                const password = passwordInput.value;
                const confirmPassword = confirmPasswordInput.value;
                
                if (username === '') {
                    showToast('İstifadəçi adı boş ola bilməz!', 'error');
                    return;
                }
                
                if (username.length < 3) {
                    showToast('İstifadəçi adı ən azı 3 simvol uzunluğunda olmalıdır!', 'error');
                    return;
                }
                
                if (email === '') {
                    showToast('Email boş ola bilməz!', 'error');
                    return;
                }
                
                if (!frontend.isValidEmail(email)) {
                    showToast('Düzgün email formatı daxil edin!', 'error');
                    return;
                }
                
                if (password.length < 6) {
                    showToast('Şifrə ən azı 6 simvol uzunluğunda olmalıdır!', 'error');
                    return;
                }
                
                if (password !== confirmPassword) {
                    showToast('Şifrələr uyğun gəlmir!', 'error');
                    return;
                }
                
                // Loading indicator əlavə et
                const registerButton = document.querySelector('#registerForm button[type="submit"]');
                const originalText = registerButton.textContent;
                registerButton.innerHTML = '<span class="spinner"></span> Qeydiyyatdan keçir...';
                registerButton.disabled = true;
                
                try {
                    const result = await authAPI.register(username, email, password);
                    if (result.success) {
                        showToast('Qeydiyyat uğurla tamamlandı!', 'success');
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 1500);
                    } else {
                        showToast(result.message, 'error');
                    }
                } catch (error) {
                    showToast('Serverə əlaqə xətası: ' + error.message, 'error');
                } finally {
                    // Loading indicator-u sil
                    registerButton.innerHTML = originalText;
                    registerButton.disabled = false;
                }
            });
        }
    },

    // Ana səhifəni yüklə
    loadHomepage: async () => {
        const homepageData = await projectsAPI.getHomepageData();
        
        if (homepageData.success) {
            const { recentProjects, stats } = homepageData.data;
            
            // Layihələri göstər (yalnız giriş edənlər üçün məlumatları gizlə)
            const restrictedSection = document.querySelector('.restricted-content');
            if (restrictedSection) {
                // Əgər token mövcudsadırsa, məlumatları göstər
                const token = localStorage.getItem('token');
                if (token) {
                    restrictedSection.style.display = 'block';
                    
                    // Son layihələri yüklə
                    const projectsContainer = document.querySelector('.recent-projects');
                    if (projectsContainer) {
                        projectsContainer.innerHTML = '';
                        recentProjects.forEach(project => {
                            projectsContainer.innerHTML += `
                                <div class="project-item">
                                    <h3>${project.title}</h3>
                                    <p>${project.description}</p>
                                    <div class="tech-stack">
                                        ${project.technologies.map(tech => `<span class="tech">${tech}</span>`).join('')}
                                    </div>
                                </div>
                            `;
                        });
                    }
                } else {
                    // Əks halda, giriş tələb olunduğunu bildir
                    restrictedSection.innerHTML = '<p>Bu məlumatlara baxmaq üçün <a href="login.html">giriş etməlisiniz</a>.</p>';
                }
            }
        }
    },

    // Naviqasiya menyusunu güncəllə
    updateNavigation: () => {
        const token = localStorage.getItem('token');
        const loginLink = document.querySelector('a[href="login.html"]');
        const registerLink = document.querySelector('a[href="register.html"]');
        const profileLink = document.querySelector('a[href="profile.html"]');
        const adminLink = document.querySelector('a[href="admin.html"]');
        const logoutLink = document.querySelector('a[href="#logout"]');
        
        if (loginLink) loginLink.style.display = token ? 'none' : 'block';
        if (registerLink) registerLink.style.display = token ? 'none' : 'block';
        if (profileLink) profileLink.style.display = token ? 'block' : 'none';
        
        // Admin linkini rola görə göstər
        if (adminLink) {
            if (token) {
                // İstifadəçi məlumatlarını alın və admin olub-olmadığını yoxlayın
                const user = JSON.parse(localStorage.getItem('user'));
                if (user && user.role === 'admin') {
                    adminLink.style.display = 'block';
                } else {
                    adminLink.style.display = 'none';
                }
            } else {
                adminLink.style.display = 'none';
            }
        }
        
        if (logoutLink && token) {
            logoutLink.style.display = 'block';
            logoutLink.onclick = (e) => {
                e.preventDefault();
                authAPI.logout();
                window.location.reload();
            };
        } else if (logoutLink) {
            logoutLink.style.display = 'none';
        }
    },

    // Səhifələri yüklə
    init: () => {
        // Səhifə növü əsasında uyğun funksiyaları başlat
        const path = window.location.pathname;
        
        if (path.includes('login.html')) {
            frontend.initLogin();
        } else if (path.includes('register.html')) {
            frontend.initRegister();
        } else if (path.includes('index.html')) {
            frontend.loadHomepage();
        }
        
        // Naviqasiyanı hər səhifədə güncəllə
        frontend.updateNavigation();
    }
};

// DOM yükləndikdən sonra funksiyaları başlat
document.addEventListener('DOMContentLoaded', frontend.init);

// Hər səhifə dəyişikliyində naviqasiyanı yenilə
window.addEventListener('load', frontend.updateNavigation);

// Toastify JS əlavə et
const addToastifyJS = () => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/toastify-js';
    script.onload = () => {
        console.log('Toastify loaded successfully');
    };
    document.head.appendChild(script);
};

// Toastify-i yüklə
addToastifyJS();