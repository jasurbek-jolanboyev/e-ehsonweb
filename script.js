// Global state management
const state = {
    isLoggedIn: false,
    user: null,
    isAdmin: false,
    campaigns: [],
    users: [],
    transactions: [],
    currentLang: 'uz',
    notifications: [],
    activityFeed: [],
    onlineUsers: 1247
};

// Utility Functions
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification px-4 py-3 rounded-lg shadow-lg text-white ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} show`;
    notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-2"></i>${message}`;
    document.getElementById('notificationContainer').appendChild(notification);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

function updateActivityFeed(activity) {
    const activityList = document.getElementById('activityList');
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item p-3 border-b border-gray-200';
    activityItem.innerHTML = `
        <div class="live-activity">
            <i class="fas fa-${activity.icon} mr-2"></i>
            <span>${activity.message}</span>
            <div class="text-xs text-gray-500">${new Date().toLocaleTimeString()}</div>
        </div>`;
    activityList.prepend(activityItem);
    state.activityFeed.push(activity);
    if (state.activityFeed.length > 10) {
        state.activityFeed.shift();
        activityList.lastChild.remove();
    }
}

// Modal Management
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
}

// Authentication Functions
function loginUser(email, password) {
    // Simulated login logic
    const user = {
        id: generateUUID(),
        fullName: 'Jasurbek Jo\'lanboyev',
        phone: '+998901234567',
        email: email,
        userType: 'admin',
        status: 'active'
    };
    
    state.isLoggedIn = true;
    state.user = user;
    state.isAdmin = user.userType === 'admin';
    
    document.getElementById('guestMenu').classList.add('hidden');
    document.getElementById('userMenu').classList.remove('hidden');
    document.getElementById('userName').textContent = user.fullName;
    document.getElementById('userNameFull').textContent = user.fullName;
    document.getElementById('userPhone').textContent = user.phone;
    
    if (state.isAdmin) {
        document.getElementById('adminPanelLink').classList.remove('hidden');
    }
    
    showNotification('Muvaffaqiyatli kirish!', 'success');
    updateActivityFeed({
        icon: 'sign-in-alt',
        message: `${user.fullName} tizimga kirdi`
    });
    
    hideModal('loginModal');
}

function logoutUser() {
    state.isLoggedIn = false;
    state.user = null;
    state.isAdmin = false;
    
    document.getElementById('guestMenu').classList.remove('hidden');
    document.getElementById('userMenu').classList.add('hidden');
    document.getElementById('adminPanelLink').classList.add('hidden');
    document.getElementById('adminSidebar').classList.remove('show');
    document.getElementById('adminContent').classList.remove('shifted');
    
    showNotification('Tizimdan chiqildi', 'success');
    updateActivityFeed({
        icon: 'sign-out-alt',
        message: 'Foydalanuvchi tizimdan chiqdi'
    });
}

// Registration System
function registerUser(formData, userType) {
    const user = {
        id: generateUUID(),
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        passwordHash: btoa(formData.password), // Simple base64 encoding for demo
        userType: userType,
        status: 'pending',
        createdAt: new Date().toISOString(),
        emailVerified: false,
        phoneVerified: false
    };
    
    if (userType === 'creator') {
        user.organization = {
            name: formData.organizationName,
            type: formData.organizationType,
            passportNumber: formData.passportNumber,
            address: formData.address,
            bankDetails: formData.bankDetails,
            documents: formData.documents
        };
    } else if (userType === 'volunteer') {
        user.volunteerProfile = {
            profession: formData.profession,
            experience: formData.experience,
            interests: formData.interests,
            availability: formData.availability,
            skills: formData.skills,
            motivation: formData.motivation
        };
    }
    
    state.users.push(user);
    
    // Simulate SMS/Email verification
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    showNotification(`Tasdiqlash kodi: ${verificationCode}`, 'info');
    updateActivityFeed({
        icon: 'user-plus',
        message: `Yangi ${userType} ro'yxatdan o'tdi: ${user.fullName}`
    });
    
    // Simulate automatic verification for demo
    setTimeout(() => {
        user.emailVerified = true;
        user.phoneVerified = true;
        user.status = 'active';
        showNotification('Foydalanuvchi muvaffaqiyatli tasdiqlandi!', 'success');
    }, 2000);
    
    return user;
}

// Admin Panel Functions
function loadAdminDashboard() {
    const dashboardSection = document.getElementById('adminDashboard');
    dashboardSection.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="admin-card p-6">
                <h3 class="text-xl font-bold text-white mb-2">Jami Xayriyalar</h3>
                <p class="impact-counter text-3xl">$2.5M+</p>
            </div>
            <div class="admin-card p-6">
                <h3 class="text-xl font-bold text-white mb-2">Faol Donorlar</h3>
                <p class="impact-counter text-3xl">15,678</p>
            </div>
            <div class="admin-card p-6">
                <h3 class="text-xl font-bold text-white mb-2">Kampaniyalar</h3>
                <p class="impact-counter text-3xl">1,247</p>
            </div>
            <div class="admin-card p-6">
                <h3 class="text-xl font-bold text-white mb-2">Mamlakatlar</h3>
                <p class="impact-counter text-3xl">47</p>
            </div>
        </div>
        <div class="admin-card p-6 mt-6">
            <h3 class="text-xl font-bold text-white mb-4">So'nggi Faoliyat</h3>
            <div class="space-y-2">
                ${state.activityFeed.map(activity => `
                    <div class="activity-item p-3">
                        <div class="live-activity">
                            <i class="fas fa-${activity.icon} mr-2"></i>
                            <span>${activity.message}</span>
                            <div class="text-xs text-gray-400">${new Date().toLocaleTimeString()}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function loadUsersManagement() {
    const usersSection = document.getElementById('adminUsers');
    usersSection.innerHTML = `
        <div class="admin-card p-6">
            <h3 class="text-xl font-bold text-white mb-4">Foydalanuvchilar Ro'yxati</h3>
            <div class="admin-table w-full">
                <table class="w-full">
                    <thead>
                        <tr>
                            <th>Ism</th>
                            <th>Email</th>
                            <th>Telefon</th>
                            <th>Turi</th>
                            <th>Holati</th>
                            <th>Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.users.map(user => `
                            <tr>
                                <td>${user.fullName}</td>
                                <td>${user.email}</td>
                                <td>${user.phone}</td>
                                <td>${user.userType}</td>
                                <td>${user.status}</td>
                                <td>
                                    <button class="btn-info px-3 py-1 rounded" onclick="editUser('${user.id}')">Tahrirlash</button>
                                    <button class="btn-danger px-3 py-1 rounded" onclick="blockUser('${user.id}')">${user.status === 'blocked' ? 'Blokdan chiqarish' : 'Bloklash'}</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function loadCampaignsManagement() {
    const campaignsSection = document.getElementById('adminCampaigns');
    campaignsSection.innerHTML = `
        <div class="admin-card p-6">
            <h3 class="text-xl font-bold text-white mb-4">Kampaniyalar</h3>
            <div class="admin-table w-full">
                <table class="w-full">
                    <thead>
                        <tr>
                            <th>Nomi</th>
                            <th>Kategoriya</th>
                            <th>Maqsad</th>
                            <th>Yig'ilgan</th>
                            <th>Holati</th>
                            <th>Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.campaigns.map(campaign => `
                            <tr>
                                <td>${campaign.title}</td>
                                <td>${campaign.category}</td>
                                <td>$${campaign.target}</td>
                                <td>$${campaign.raised}</td>
                                <td>${campaign.status}</td>
                                <td>
                                    <button class="btn-info px-3 py-1 rounded" onclick="editCampaign('${campaign.id}')">Tahrirlash</button>
                                    <button class="btn-success px-3 py-1 rounded" onclick="approveCampaign('${campaign.id}')">Tasdiqlash</button>
                                    <button class="btn-danger px-3 py-1 rounded" onclick="rejectCampaign('${campaign.id}')">Rad etish</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function loadFinancialManagement() {
    const financialSection = document.getElementById('adminFinancial');
    financialSection.innerHTML = `
        <div class="admin-card p-6">
            <h3 class="text-xl font-bold text-white mb-4">Moliyaviy Operatsiyalar</h3>
            <div class="admin-table w-full">
                <table class="w-full">
                    <thead>
                        <tr>
                            <th>Tranzaksiya ID</th>
                            <th>Foydalanuvchi</th>
                            <th>Mablag'</th>
                            <th>Turi</th>
                            <th>Sana</th>
                            <th>Holati</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.transactions.map(transaction => `
                            <tr>
                                <td>${transaction.id}</td>
                                <td>${transaction.user}</td>
                                <td>$${transaction.amount}</td>
                                <td>${transaction.type}</td>
                                <td>${new Date(transaction.date).toLocaleDateString()}</td>
                                <td>${transaction.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function loadSystemSettings() {
    const settingsSection = document.getElementById('adminSettings');
    settingsSection.innerHTML = `
        <div class="admin-card p-6">
            <h3 class="text-xl font-bold text-white mb-4">Tizim Sozlamalari</h3>
            <form id="settingsForm" class="space-y-4">
                <div>
                    <label class="block text-white font-medium mb-2">Sayt Nomi</label>
                    <input type="text" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" value="E-Ehson Global">
                </div>
                <div>
                    <label class="block text-white font-medium mb-2">Komissiya Foizi</label>
                    <input type="number" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" value="5">
                </div>
                <div>
                    <label class="block text-white font-medium mb-2">Asosiy Til</label>
                    <select class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg">
                        <option value="uz">O'zbek</option>
                        <option value="ru">Русский</option>
                        <option value="en">English</option>
                    </select>
                </div>
                <button type="submit" class="btn-primary text-white px-6 py-3 rounded-lg">Saqlash</button>
            </form>
        </div>
    `;
}

// Admin Actions
window.editUser = function(userId) {
    const user = state.users.find(u => u.id === userId);
    showModal('editUserModal');
    // Populate modal with user data (implementation omitted for brevity)
};

window.blockUser = function(userId) {
    const user = state.users.find(u => u.id === userId);
    user.status = user.status === 'blocked' ? 'active' : 'blocked';
    loadUsersManagement();
    showNotification(`Foydalanuvchi ${user.status === 'blocked' ? 'bloklandi' : 'blokdan chiqarildi'}`, 'success');
};

window.editCampaign = function(campaignId) {
    const campaign = state.campaigns.find(c => c.id === campaignId);
    showModal('editCampaignModal');
    // Populate modal with campaign data (implementation omitted for brevity)
};

window.approveCampaign = function(campaignId) {
    const campaign = state.campaigns.find(c => c.id === campaignId);
    campaign.status = 'approved';
    loadCampaignsManagement();
    showNotification('Kampaniya tasdiqlandi', 'success');
};

window.rejectCampaign = function(campaignId) {
    const campaign = state.campaigns.find(c => c.id === campaignId);
    campaign.status = 'rejected';
    loadCampaignsManagement();
    showNotification('Kampaniya rad etildi', 'error');
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Simulate initial data
    state.campaigns = [
        { id: generateUUID(), title: 'Yurak Operatsiyasi', category: 'health', target: 50000, raised: 35000, status: 'pending' },
        { id: generateUUID(), title: 'Maktab Qurilishi', category: 'education', target: 100000, raised: 75000, status: 'approved' }
    ];
    
    state.transactions = [
        { id: generateUUID(), user: 'Jasurbek', amount: 1000, type: 'donation', date: new Date(), status: 'completed' }
    ];
    
    // Mobile Menu Toggle
    document.getElementById('mobileMenuToggle').addEventListener('click', () => {
        document.getElementById('mobileMenu').classList.add('show');
    });
    
    document.getElementById('closeMobileMenu').addEventListener('click', () => {
        document.getElementById('mobileMenu').classList.remove('show');
    });
    
    // Language Switcher
    document.getElementById('languageBtn').addEventListener('click', () => {
        document.getElementById('languageDropdown').classList.toggle('show');
    });
    
    document.querySelectorAll('.language-option').forEach(option => {
        option.addEventListener('click', () => {
            state.currentLang = option.dataset.lang;
            document.getElementById('currentLang').textContent = option.querySelector('span').textContent;
            document.getElementById('currentFlag').src = option.querySelector('img').src;
            document.getElementById('languageDropdown').classList.remove('show');
            showNotification('Til o\'zgartirildi', 'success');
        });
    });
    
    // Login/Signup Modals
    document.getElementById('loginBtn').addEventListener('click', () => showModal('loginModal'));
    document.getElementById('signupBtn').addEventListener('click', () => showModal('signupModal'));
    
    // User Menu
    document.getElementById('profileDropdown').addEventListener('click', () => {
        document.getElementById('dropdownMenu').classList.toggle('hidden');
    });
    
    document.getElementById('logoutBtn').addEventListener('click', logoutUser);
    
    // Admin Panel Toggle
    document.getElementById('adminPanelLink').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('adminSidebar').classList.add('show');
        document.getElementById('adminContent').classList.add('shifted');
        loadAdminDashboard();
    });
    
    // Activity Feed Toggle
    document.getElementById('toggleActivityFeed').addEventListener('click', () => {
        document.getElementById('activityFeed').classList.toggle('translate-x-full');
    });
    
    // FAQ Toggle
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            faqItem.classList.toggle('active');
        });
    });
    
    // Chat Widget
    document.getElementById('chatToggle').addEventListener('click', () => {
        document.getElementById('chatWidget').classList.toggle('show');
    });
    
    document.getElementById('closeChatWidget').addEventListener('click', () => {
        document.getElementById('chatWidget').classList.remove('show');
    });
    
    document.getElementById('chatForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('chatInput');
        if (input.value.trim()) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'flex justify-end';
            messageDiv.innerHTML = `
                <div class="bg-green-500 text-white p-3 rounded-lg rounded-br-none max-w-xs">
                    <p class="text-sm">${input.value}</p>
                </div>`;
            document.getElementById('chatMessages').appendChild(messageDiv);
            input.value = '';
            // Simulate bot response
            setTimeout(() => {
                const responseDiv = document.createElement('div');
                responseDiv.className = 'flex';
                responseDiv.innerHTML = `
                    <div class="bg-blue-500 text-white p-3 rounded-lg rounded-bl-none max-w-xs">
                        <p class="text-sm">Xabaringiz uchun rahmat! Tez orada javob beramiz.</p>
                    </div>`;
                document.getElementById('chatMessages').appendChild(responseDiv);
            }, 1000);
        }
    });
    
    // Admin Navigation
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.admin-nav-item').forEach(nav => nav.classList.remove('active'));
            document.querySelectorAll('.admin-section').forEach(section => section.classList.remove('active'));
            item.classList.add('active');
            document.getElementById(item.dataset.section).classList.add('active');
            
            switch (item.dataset.section) {
                case 'adminDashboard':
                    loadAdminDashboard();
                    break;
                case 'adminUsers':
                    loadUsersManagement();
                    break;
                case 'adminCampaigns':
                    loadCampaignsManagement();
                    break;
                case 'adminFinancial':
                    loadFinancialManagement();
                    break;
                case 'adminSettings':
                    loadSystemSettings();
                    break;
            }
        });
    });
});

// Add necessary modals to HTML
document.body.insertAdjacentHTML('beforeend', `
    <!-- Login Modal -->
    <div id="loginModal" class="modal">
        <div class="modal-content glass-morphism p-6 md:p-8 rounded-2xl max-w-md w-full">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-white">Tizimga Kirish</h3>
                <button onclick="hideModal('loginModal')" class="text-white hover:text-gray-300">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="loginForm" class="space-y-4">
                <div>
                    <label class="block text-white font-medium mb-2">Email</label>
                    <input type="email" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" placeholder="email@example.com" required>
                </div>
                <div>
                    <label class="block text-white font-medium mb-2">Parol</label>
                    <input type="password" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" placeholder="Parolingiz" required>
                </div>
                <button type="submit" class="w-full btn-primary text-white py-3 rounded-lg">Kirish</button>
            </form>
        </div>
    </div>

    <!-- Signup Modal -->
    <div id="signupModal" class="modal">
        <div class="modal-content glass-morphism p-6 md:p-8 rounded-2xl max-w-lg w-full">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-white">Ro'yxatdan O'tish</h3>
                <button onclick="hideModal('signupModal')" class="text-white hover:text-gray-300">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="signupForm" class="space-y-4">
                <div>
                    <label class="block text-white font-medium mb-2">Foydalanuvchi Turi</label>
                    <select id="userType" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" required>
                        <option value="user">Oddiy Foydalanuvchi</option>
                        <option value="creator">Kampaniya Yaratuvchi</option>
                        <option value="volunteer">Ko'ngilli</option>
                    </select>
                </div>
                <div>
                    <label class="block text-white font-medium mb-2">Ism va Familiya</label>
                    <input type="text" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" placeholder="Ism va Familiya" required>
                </div>
                <div>
                    <label class="block text-white font-medium mb-2">Telefon</label>
                    <input type="tel" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" placeholder="+998901234567" required>
                </div>
                <div>
                    <label class="block text-white font-medium mb-2">Email</label>
                    <input type="email" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" placeholder="email@example.com" required>
                </div>
                <div>
                    <label class="block text-white font-medium mb-2">Parol</label>
                    <input type="password" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" placeholder="Parolingiz" required>
                </div>
                <div>
                    <label class="block text-white font-medium mb-2">Parolni Tasdiqlash</label>
                    <input type="password" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" placeholder="Parolni qayta kiriting" required>
                </div>
                <div id="creatorFields" class="hidden space-y-4">
                    <div>
                        <label class="block text-white font-medium mb-2">Tashkilot Nomi</label>
                        <input type="text" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" placeholder="Tashkilot nomi (ixtiyoriy)">
                    </div>
                    <div>
                        <label class="block text-white font-medium mb-2">Tashkilot Turi</label>
                        <select class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg">
                            <option value="individual">Jismoniy shaxs</option>
                            <option value="organization">Yuridik shaxs</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-white font-medium mb-2">Passport/ID Raqami</label>
                        <input type="text" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" placeholder="Passport raqami">
                    </div>
                    <div>
                        <label class="block text-white font-medium mb-2">Manzil</label>
                        <input type="text" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" placeholder="Manzilingiz">
                    </div>
                    <div>
                        <label class="block text-white font-medium mb-2">Bank Rekvizitlari</label>
                        <input type="text" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" placeholder="Bank ma'lumotlari">
                    </div>
                    <div>
                        <label class="block text-white font-medium mb-2">Hujjatlar</label>
                        <div class="file-upload-area">
                            <p>Hujjatlarni yuklash</p>
                            <input type="file" multiple class="hidden">
                        </div>
                    </div>
                </div>
                <div id="volunteerFields" class="hidden space-y-4">
                    <div>
                        <label class="block text-white font-medium mb-2">Kasb/Mutaxassislik</label>
                        <input type="text" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" placeholder="Kasbingiz">
                    </div>
                    <div>
                        <label class="block text-white font-medium mb-2">Tajriba (yillar)</label>
                        <input type="number" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" placeholder="Tajriba yillari">
                    </div>
                    <div>
                        <label class="block text-white font-medium mb-2">Qiziqish Sohalari</label>
                        <input type="text" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" placeholder="Qiziqish sohalari">
                    </div>
                    <div>
                        <label class="block text-white font-medium mb-2">Mavjud Vaqt (haftada soat)</label>
                        <input type="number" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" placeholder="Haftada soatlar">
                    </div>
                    <div>
                        <label class="block text-white font-medium mb-2">Ko'nikmalar</label>
                        <input type="text" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" placeholder="Ko'nikmalar ro'yxati">
                    </div>
                    <div>
                        <label class="block text-white font-medium mb-2">Motivatsiya Xati</label>
                        <textarea class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg h-32" placeholder="Nima uchun ko'ngilli bo'lishni xohlaysiz?"></textarea>
                    </div>
                </div>
                <div>
                    <label class="flex items-center text-white">
                        <input type="checkbox" class="mr-2" required>
                        Foydalanish shartlarini qabul qilaman
                    </label>
                </div>
                <button type="submit" class="w-full btn-primary text-white py-3 rounded-lg">Ro'yxatdan O'tish</button>
            </form>
        </div>
    </div>

    <!-- Admin Panel -->
    <div id="adminSidebar" class="admin-sidebar">
        <div class="p-6">
            <div class="flex items-center mb-8">
                <div class="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-3">
                    <i class="fas fa-crown text-yellow-300"></i>
                </div>
                <div>
                    <h2 class="text-xl font-bold text-white">Admin Panel</h2>
                    <p class="text-sm text-gray-300">E-Ehson Global</p>
                </div>
            </div>
            <nav class="space-y-2">
                <button class="admin-nav-item active flex items-center w-full px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 rounded-lg" data-section="adminDashboard">
                    <i class="fas fa-tachometer-alt mr-3"></i>Dashboard
                </button>
                <button class="admin-nav-item flex items-center w-full px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 rounded-lg" data-section="adminUsers">
                    <i class="fas fa-users mr-3"></i>Foydalanuvchilar
                </button>
                <button class="admin-nav-item flex items-center w-full px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 rounded-lg" data-section="adminCampaigns">
                    <i class="fas fa-bullhorn mr-3"></i>Kampaniyalar
                </button>
                <button class="admin-nav-item flex items-center w-full px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 rounded-lg" data-section="adminFinancial">
                    <i class="fas fa-money-bill-wave mr-3"></i>Moliyaviy
                </button>
                <button class="admin-nav-item flex items-center w-full px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 rounded-lg" data-section="adminSettings">
                    <i class="fas fa-cog mr-3"></i>Sozlamalar
                </button>
            </nav>
        </div>
    </div>
    <div id="adminContent" class="admin-content p-6">
        <div id="adminDashboard" class="admin-section active"></div>
        <div id="adminUsers" class="admin-section"></div>
        <div id="adminCampaigns" class="admin-section"></div>
        <div id="adminFinancial" class="admin-section"></div>
        <div id="adminSettings" class="admin-section"></div>
    </div>

    <!-- Edit User Modal -->
    <div id="editUserModal" class="modal">
        <div class="modal-content glass-morphism p-6 md:p-8 rounded-2xl max-w-md w-full">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-white">Foydalanuvchi Tahrirlash</h3>
                <button onclick="hideModal('editUserModal')" class="text-white hover:text-gray-300">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="editUserForm" class="space-y-4">
                <div>
                    <label class="block text-white font-medium mb-2">Ism va Familiya</label>
                    <input type="text" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" placeholder="Ism va Familiya">
                </div>
                <div>
                    <label class="block text-white font-medium mb-2">Email</label>
                    <input type="email" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" placeholder="email@example.com">
                </div>
                <div>
                    <label class="block text-white font-medium mb-2">Telefon</label>
                    <input type="tel" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" placeholder="+998901234567">
                </div>
                <button type="submit" class="w-full btn-primary text-white py-3 rounded-lg">Saqlash</button>
            </form>
        </div>
    </div>

    <!-- Edit Campaign Modal -->
    <div id="editCampaignModal" class="modal">
        <div class="modal-content glass-morphism p-6 md:p-8 rounded-2xl max-w-md w-full">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-white">Kampaniya Tahrirlash</h3>
                <button onclick="hideModal('editCampaignModal')" class="text-white hover:text-gray-300">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="editCampaignForm" class="space-y-4">
                <div>
                    <label class="block text-white font-medium mb-2">Nomi</label>
                    <input type="text" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" placeholder="Kampaniya nomi">
                </div>
                <div>
                    <label class="block text-white font-medium mb-2">Kategoriya</label>
                    <select class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg">
                        <option value="health">Sog'liq</option>
                        <option value="education">Ta'lim</option>
                        <option value="emergency">Favqulodda</option>
                    </select>
                </div>
                <div>
                    <label class="block text-white font-medium mb-2">Maqsad ($)</label>
                    <input type="number" class="w-full px-4 py-3 bg-gray-800 text-white rounded-lg" placeholder="Maqsad summasi">
                </div>
                <button type="submit" class="w-full btn-primary text-white py-3 rounded-lg">Saqlash</button>
            </form>
        </div>
    </div>
`);

// Form Submissions
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    loginUser(formData.get('email'), formData.get('password'));
});

document.getElementById('signupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userType = formData.get('userType');
    const data = {
        fullName: formData.get('fullName'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        password: formData.get('password'),
        organizationName: formData.get('organizationName'),
        organizationType: formData.get('organizationType'),
        passportNumber: formData.get('passportNumber'),
        address: formData.get('address'),
        bankDetails: formData.get('bankDetails'),
        documents: [], // Handle file uploads
        profession: formData.get('profession'),
        experience: formData.get('experience'),
        interests: formData.get('interests'),
        availability: formData.get('availability'),
        skills: formData.get('skills'),
        motivation: formData.get('motivation')
    };
    
    if (data.password !== formData.get('confirmPassword')) {
        showNotification('Parollar mos kelmaydi', 'error');
        return;
    }
    
    if (data.password.length < 8 || !/[A-Z]/.test(data.password) || !/[0-9]/.test(data.password)) {
        showNotification('Parol kamida 8 belgi, katta harf va raqamdan iborat bo\'lishi kerak', 'error');
        return;
    }
    
    registerUser(data, userType);
    hideModal('signupModal');
});

// User Type Selection
document.getElementById('userType').addEventListener('change', (e) => {
    const creatorFields = document.getElementById('creatorFields');
    const volunteerFields = document.getElementById('volunteerFields');
    creatorFields.classList.add('hidden');
    volunteerFields.classList.add('hidden');
    
    if (e.target.value === 'creator') {
        creatorFields.classList.remove('hidden');
    } else if (e.target.value === 'volunteer') {
        volunteerFields.classList.remove('hidden');
    }
});

// Simulate loading state
document.getElementById('globalLoading').style.display = 'flex';
const loadingProgress = document.getElementById('loadingProgress');
let progress = 0;
const interval = setInterval(() => {
    progress += 10;
    loadingProgress.style.width = `${progress}%`;
    if (progress >= 100) {
        clearInterval(interval);
        document.getElementById('globalLoading').style.display = 'none';
    }
}, 300);