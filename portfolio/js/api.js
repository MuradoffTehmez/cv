// API əlaqə funksiyaları
const API_BASE_URL = 'http://localhost:5000/api';

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
    }
};

// Frontend funksiyaları
const frontend = {
    // Login form təqdimatı
    initLogin: () => {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                const result = await authAPI.login(username, password);
                if (result.success) {
                    alert('Giriş uğurludur!');
                    window.location.href = 'profile.html';
                } else {
                    alert(result.message);
                }
            });
        }
    },

    // Register form təqdimatı
    initRegister: () => {
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const username = document.getElementById('regUsername').value;
                const email = document.getElementById('regEmail').value;
                const password = document.getElementById('regPassword').value;
                
                const result = await authAPI.register(username, email, password);
                if (result.success) {
                    alert('Qeydiyyat uğurla tamamlandı!');
                    window.location.href = 'login.html';
                } else {
                    alert(result.message);
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
        const logoutLink = document.querySelector('a[href="#logout"]');
        
        if (loginLink) loginLink.style.display = token ? 'none' : 'block';
        if (registerLink) registerLink.style.display = token ? 'none' : 'block';
        if (profileLink) profileLink.style.display = token ? 'block' : 'none';
        
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