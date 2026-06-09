// ==================== FIREBASE CONFIGURATION ====================
const firebaseConfig = {
    apiKey: "AIzaSyD3oMlsv9C3Qepvkw_Y1JVfhVJiMwZLox4",
    authDomain: "bsceee-webpage.firebaseapp.com",
    databaseURL: "https://bsceee-webpage-default-rtdb.firebaseio.com",
    projectId: "bsceee-webpage",
    storageBucket: "bsceee-webpage.appspot.com",
    messagingSenderId: "281106710079",
    appId: "1:281106710079:web:2c6ab931bc3cab8e4e428a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();
let messaging = null;

// Global variables
let currentEditingSection = '';
let isAdmin = false;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 App initializing...');
    
    // Load content from Firebase
    loadContent();
    
    // Setup theme toggle
    setupTheme();
    
    // Setup sidebar
    setupSidebar();
    
    // Setup PWA
    setupPWA();
    
    // Setup Firebase Messaging (simplified)
    setupFirebaseMessaging();
    
    // Setup notifications
    setupNotifications();
    
    // Check admin auth
    auth.onAuthStateChanged(handleAuthChange);
    
    // Load custom sections
    loadCustomSections();
});

// ==================== CONTENT LOADING ====================
function loadContent() {
    // Hero Section
    db.ref('websiteContent/hero').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            document.getElementById('heroTitle').textContent = data.title;
            document.getElementById('heroSubtitle').textContent = data.subtitle;
        }
    });
    
    // About Section
    db.ref('websiteContent/about').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) document.getElementById('aboutContent').textContent = data.content;
    });
    
    // Features Section
    db.ref('websiteContent/features').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) document.getElementById('featuresContent').innerHTML = data.content;
    });
    
    // News Section
    db.ref('websiteContent/news').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) document.getElementById('newsContent').innerHTML = data.content;
    });
    
    // Fun Facts
    db.ref('websiteContent/funFacts').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && data.items) {
            const factsList = document.getElementById('funFactsContent');
            factsList.innerHTML = '';
            data.items.forEach(fact => {
                const li = document.createElement('li');
                li.textContent = fact;
                factsList.appendChild(li);
            });
        }
    });
    
    // Spotlight
    db.ref('websiteContent/spotlight').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) document.getElementById('spotlightContent').innerHTML = data.content;
    });
    
    // Quiz
    db.ref('websiteContent/quiz').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) document.getElementById('quizContent').innerHTML = data.content;
    });
}

// ==================== ADMIN FUNCTIONS ====================
function handleAuthChange(user) {
    if (user) {
        db.ref('admins/' + user.uid).once('value').then((snapshot) => {
            if (snapshot.exists()) {
                isAdmin = true;
                showAdminFeatures();
            } else {
                hideAdminFeatures();
            }
        });
    } else {
        hideAdminFeatures();
    }
}

function showAdminFeatures() {
    document.querySelectorAll('.admin-edit-btn').forEach(btn => btn.style.display = 'inline-block');
    document.getElementById('adminIndicator').style.display = 'block';
    document.getElementById('adminDashboardLink').style.display = 'block';
    document.getElementById('adminLoginLink').style.display = 'none';
}

function hideAdminFeatures() {
    document.querySelectorAll('.admin-edit-btn').forEach(btn => btn.style.display = 'none');
    document.getElementById('adminIndicator').style.display = 'none';
    document.getElementById('adminDashboardLink').style.display = 'none';
    document.getElementById('adminLoginLink').style.display = 'block';
}

function openEditor(section) {
    if (!isAdmin) return;
    
    currentEditingSection = section;
    const modal = document.getElementById('adminModal');
    const editor = document.getElementById('contentEditor');
    const modalTitle = document.getElementById('modalTitle');
    
    const titles = {
        'hero': 'Edit Hero Section',
        'about': 'Edit About Section',
        'features': 'Edit Features Section',
        'news': 'Edit News Section',
        'funFacts': 'Edit Fun Facts',
        'spotlight': 'Edit Student Spotlight',
        'quiz': 'Edit Weekly Quiz'
    };
    modalTitle.textContent = titles[section] || 'Edit Content';
    
    let content = '';
    switch(section) {
        case 'hero':
            content = document.getElementById('heroTitle').textContent + '\n---\n' + document.getElementById('heroSubtitle').textContent;
            break;
        case 'funFacts':
            const facts = Array.from(document.getElementById('funFactsContent').getElementsByTagName('li')).map(li => li.textContent);
            content = facts.join('\n');
            break;
        default:
            content = document.getElementById(section + 'Content')?.innerHTML || document.getElementById(section + 'Content')?.textContent || '';
    }
    
    editor.value = content;
    modal.style.display = 'block';
}

function closeEditor() {
    document.getElementById('adminModal').style.display = 'none';
}

function saveContent() {
    const newContent = document.getElementById('contentEditor').value;
    
    switch(currentEditingSection) {
        case 'hero':
            const lines = newContent.split('\n---\n');
            db.ref('websiteContent/hero').set({ title: lines[0] || '', subtitle: lines[1] || '' });
            break;
        case 'about':
            db.ref('websiteContent/about').set({ content: newContent });
            break;
        case 'features':
            db.ref('websiteContent/features').set({ content: newContent });
            break;
        case 'news':
            db.ref('websiteContent/news').set({ content: newContent });
            break;
        case 'funFacts':
            const facts = newContent.split('\n').filter(f => f.trim());
            db.ref('websiteContent/funFacts').set({ items: facts });
            break;
        case 'spotlight':
            db.ref('websiteContent/spotlight').set({ content: newContent });
            break;
        case 'quiz':
            db.ref('websiteContent/quiz').set({ content: newContent });
            break;
    }
    
    closeEditor();
    alert('✅ Content updated successfully!');
}

// ==================== FIREBASE MESSAGING (SIMPLIFIED - NO SERVICE WORKER ERRORS) ====================
function setupFirebaseMessaging() {
    // Check if messaging is supported
    if (!firebase.messaging || !firebase.messaging.isSupported()) {
        console.log('📱 Firebase Messaging not supported in this browser');
        return;
    }
    
    // Request notification permission
    if (Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('✅ Notification permission granted');
                initMessaging();
            }
        });
    } else {
        initMessaging();
    }
}

function initMessaging() {
    try {
        messaging = firebase.messaging();
        
        // Listen for foreground messages
        messaging.onMessage((payload) => {
            console.log('📨 Message received:', payload);
            
            // Show notification
            const title = payload.notification?.title || 'New Announcement';
            const options = {
                body: payload.notification?.body || 'Check the website for updates',
                icon: 'pngegg.png',
                badge: 'pngegg.png'
            };
            
            new Notification(title, options);
            
            // Update notification badge
            updateNotificationBadge();
        });
        
        console.log('✅ Firebase Messaging active (foreground only)');
        
    } catch (error) {
        console.log('❌ Messaging error:', error.message);
    }
}

// ==================== NOTIFICATIONS ====================
function updateNotificationBadge() {
    const badge = document.getElementById('notificationCount');
    if (!badge) return;
    
    db.ref('announcements').once('value').then(snapshot => {
        if (!snapshot.exists()) {
            badge.style.display = 'none';
            return;
        }
        
        const data = snapshot.val();
        const activeCount = Object.values(data).filter(a => a.status === 'active').length;
        
        if (activeCount > 0) {
            badge.textContent = activeCount > 9 ? '9+' : activeCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    });
}

function setupNotifications() {
    updateNotificationBadge();
    setInterval(updateNotificationBadge, 30000);
}

// ==================== PWA SETUP ====================
function setupPWA() {
    // Service Worker for PWA only (not for messaging)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('✅ PWA SW registered:', reg.scope))
            .catch(err => console.log('❌ PWA SW failed:', err));
    }
    
    // Install Button
    let deferredPrompt;
    const installBtn = document.getElementById('installButton');
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installBtn) installBtn.style.display = 'block';
    });
    
    installBtn?.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                installBtn.style.display = 'none';
            }
            deferredPrompt = null;
        }
    });
}

// ==================== CUSTOM SECTIONS ====================
function loadCustomSections() {
    db.ref('customSections').once('value').then(snapshot => {
        const data = snapshot.val();
        if (!data) return;
        
        const container = document.getElementById('customSectionsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        const sections = Object.values(data).sort((a, b) => a.order - b.order);
        
        sections.forEach(section => {
            const sectionHtml = renderCustomSection(section);
            container.insertAdjacentHTML('beforeend', sectionHtml);
        });
    });
}

function renderCustomSection(section) {
    let contentHtml = '';
    
    switch(section.type) {
        case 'text':
            contentHtml = `<div class="text-content">${(section.content || '').replace(/\n/g, '<br>')}</div>`;
            break;
        case 'documents':
            if (section.documents?.length) {
                contentHtml = `<div class="documents-grid">${section.documents.map(doc => `
                    <div class="document-card">
                        <h4>${doc.title}</h4>
                        ${doc.description ? `<p>${doc.description}</p>` : ''}
                        <a href="${doc.link}" target="_blank" class="doc-link">Download</a>
                    </div>
                `).join('')}</div>`;
            }
            break;
        case 'links':
            if (section.links?.length) {
                contentHtml = `<div class="links-list">${section.links.map(link => `
                    <div class="link-item">
                        <a href="${link.url}" target="_blank" class="link-url">${link.text}</a>
                        ${link.description ? `<p class="link-desc">${link.description}</p>` : ''}
                    </div>
                `).join('')}</div>`;
            }
            break;
        case 'custom':
            contentHtml = section.customHTML || '<p>No content available.</p>';
            break;
    }
    
    return `
        <section class="custom-section">
            <h2>${section.title}</h2>
            ${contentHtml}
            ${isAdmin ? `<button class="admin-edit-btn" onclick="alert('Edit in admin dashboard')">Edit Section</button>` : ''}
        </section>
    `;
}

// ==================== THEME ====================
function setupTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    themeToggle?.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        const newTheme = current === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// ==================== SIDEBAR ====================
function setupSidebar() {
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    menuBtn?.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });
    
    overlay?.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });
}
