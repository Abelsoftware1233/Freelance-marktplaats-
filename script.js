/* ============================================================
   ABEL123 :: FREELANCE OPDRACHTEN PLATFORM
   Full-stack met Flask backend - IEDEREEN ZIET ELKAARS OPDRACHTEN
   ============================================================ */

// ============================================================
// API_BASE - Verbindt met de Flask backend
// ============================================================
const API_BASE = (() => {
    // Lokaal ontwikkelen: gebruik localhost:5000
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    
    // PRODUCTIE: Vervang dit met jouw live backend URL!
    // Voorbeeld: https://abel123-backend.onrender.com/api
    // OF: https://api.abel123.nl/api
    return 'http://localhost:5000/api'; // <-- PAS DIT AAN VOOR PRODUCTIE!
})();

// ============================================================
// CATEGORIES - Alle beschikbare categorieën
// ============================================================
const CATEGORIES = [
  { id:'it-software', icon:'💻', name:'IT & Software', sub:['Webontwikkeling','App ontwikkeling','Backend development','DevOps & Cloud','Cybersecurity','Data engineering','QA & Testen','Systeembeheer'] },
  { id:'design-creatief', icon:'🎨', name:'Design & Creatief', sub:['UI/UX Design','Grafisch ontwerp','Illustratie','Branding & Logo','Motion design','3D Design','Interieurontwerp'] },
  { id:'marketing-sales', icon:'📈', name:'Marketing & Sales', sub:['SEO/SEA','Social media marketing','Content marketing','E-mailmarketing','Sales & Acquisitie','Marktonderzoek'] },
  { id:'tekst-vertaling', icon:'✍️', name:'Tekst & Vertaling', sub:['Copywriting','Vertalingen','Redactie & Proofreading','Technisch schrijven','Ondertiteling'] },
  { id:'video-audio', icon:'🎬', name:'Video & Audio', sub:['Videomontage','Animatie','Podcast productie','Voice-over','Muziekproductie'] },
  { id:'bouw-techniek', icon:'🏗️', name:'Bouw & Techniek', sub:['Aannemer','Elektricien','Installatietechniek','Bouwkundig tekenaar','Projectleider bouw'] },
  { id:'zorg-welzijn', icon:'🩺', name:'Zorg & Welzijn', sub:['ZZP Verpleegkundige','Fysiotherapeut','Psycholoog','Thuiszorg','Coaching'] },
  { id:'financieel-juridisch', icon:'💼', name:'Financieel & Juridisch', sub:['Boekhouding','Belastingadvies','Juridisch advies','Interim controller','Compliance'] },
  { id:'onderwijs-training', icon:'🎓', name:'Onderwijs & Training', sub:['Bijles','Trainingen geven','E-learning ontwikkeling','Taalcoaching'] },
  { id:'logistiek-transport', icon:'🚚', name:'Logistiek & Transport', sub:['Chauffeur','Supply chain planning','Warehouse management','Koeriersdiensten'] },
  { id:'horeca-events', icon:'🍽️', name:'Horeca & Events', sub:['Evenementenorganisatie','Catering','Bartender','DJ','Fotografie events'] },
  { id:'administratie-support', icon:'🗂️', name:'Administratie & Support', sub:['Virtuele assistent','Data-invoer','Klantenservice','Officemanagement'] },
  { id:'architectuur-engineering', icon:'📐', name:'Architectuur & Engineering', sub:['Architect','Werktuigbouwkundig ingenieur','Bouwkundig adviseur','CAD Tekenaar'] },
  { id:'landbouw-groen', icon:'🌱', name:'Agrarisch & Groen', sub:['Hovenier','Agrarisch adviseur','Boomverzorging'] },
  { id:'muziek-entertainment', icon:'🎤', name:'Muziek & Entertainment', sub:['Muzikant','Gameontwikkeling','Streaming & content creatie'] },
];

// ============================================================
// STATE
// ============================================================
let currentLang = 'nl';
let currentUser = null;
let currentJobDetailId = null;
let currentFreelancerDetailId = null;
let activeChatPeerId = null;
let regType = 'freelancer';
let accessToken = null;

// ============================================================
// API HELPERS - Dit stuurt requests naar de backend
// ============================================================
async function apiRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const config = {
        ...options,
        headers,
    };
    
    if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
    }
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || data.message || `HTTP ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function apiGet(endpoint) {
    return apiRequest(endpoint, { method: 'GET' });
}

async function apiPost(endpoint, data) {
    return apiRequest(endpoint, { method: 'POST', body: data });
}

async function apiPut(endpoint, data) {
    return apiRequest(endpoint, { method: 'PUT', body: data });
}

async function apiDelete(endpoint) {
    return apiRequest(endpoint, { method: 'DELETE' });
}

// ============================================================
// AUTHENTICATIE - Inloggen, registreren, sessie beheren
// ============================================================
function getSession() {
    try {
        const data = JSON.parse(localStorage.getItem('wn_session'));
        if (data && data.token) {
            accessToken = data.token;
            return data;
        }
        return null;
    } catch(e) {
        return null;
    }
}

function setSession(userId, token) {
    accessToken = token;
    localStorage.setItem('wn_session', JSON.stringify({ userId, token }));
}

function clearSession() {
    accessToken = null;
    localStorage.removeItem('wn_session');
}

async function checkSession() {
    const session = getSession();
    if (session && session.userId) {
        try {
            const user = await apiGet('/auth/me');
            currentUser = user;
            updateAuthUI();
            return true;
        } catch (error) {
            clearSession();
            currentUser = null;
            updateAuthUI();
            return false;
        }
    }
    currentUser = null;
    updateAuthUI();
    return false;
}

async function handleRegister() {
    console.log('🔵 Register called');
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    const roleTitle = document.getElementById('regRoleTitle').value.trim();
    const company = document.getElementById('regCompany').value.trim();
    const category = document.getElementById('regCategory').value;
    const location = document.getElementById('regLocation').value.trim();
    const errEl = document.getElementById('registerError');

    if (!firstName || !lastName || !email || !password) {
        return showFormError(errEl, currentLang === 'nl' ? 'Vul alle verplichte velden in.' : 'Please fill in all required fields.');
    }
    if (password.length < 6) {
        return showFormError(errEl, currentLang === 'nl' ? 'Wachtwoord moet minimaal 6 tekens zijn.' : 'Password must be at least 6 characters.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return showFormError(errEl, currentLang === 'nl' ? 'Voer een geldig e-mailadres in.' : 'Enter a valid email address.');
    }
    errEl.classList.remove('show');

    try {
        console.log('📤 Sending registration to:', API_BASE + '/auth/register');
        const result = await apiPost('/auth/register', {
            firstName,
            lastName,
            email,
            password,
            role: regType,
            roleTitle: roleTitle || (regType === 'client' ? 'Opdrachtgever' : 'Freelancer'),
            company: company || '',
            category: category || CATEGORIES[0].id,
            location: location || 'Nederland',
            skills: [],
            hourlyRate: 0,
            bio: ''
        });
        
        console.log('✅ Registration successful:', result);
        currentUser = result.user;
        closeModal('registerModal');
        toast(currentLang === 'nl' ? `Welkom, ${firstName}! Je account is aangemaakt.` : `Welcome, ${firstName}! Your account has been created.`);
        showView('dashboard');
    } catch (error) {
        console.error('❌ Registration error:', error);
        showFormError(errEl, error.message);
    }
}

async function handleLogin() {
    console.log('🔵 Login called');
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');

    if (!email || !password) {
        return showFormError(errEl, currentLang === 'nl' ? 'Vul e-mail en wachtwoord in.' : 'Enter email and password.');
    }
    errEl.classList.remove('show');

    try {
        console.log('📤 Sending login to:', API_BASE + '/auth/login');
        const result = await apiPost('/auth/login', { email, password });
        console.log('✅ Login successful:', result);
        setSession(result.user.id, result.access_token);
        currentUser = result.user;
        updateAuthUI();
        closeModal('loginModal');
        toast(currentLang === 'nl' ? `Welkom terug, ${currentUser.firstName}!` : `Welcome back, ${currentUser.firstName}!`);
        showView('dashboard');
    } catch (error) {
        console.error('❌ Login error:', error);
        showFormError(errEl, error.message);
    }
}

function logout() {
    currentUser = null;
    clearSession();
    updateAuthUI();
    showView('home');
    toast(currentLang === 'nl' ? 'Je bent uitgelogd.' : 'You have been logged out.');
}

function showFormError(el, msg) {
    el.textContent = msg;
    el.classList.add('show');
}

function requireAuthThen(modalId) {
    if (!currentUser) {
        toast(currentLang === 'nl' ? 'Log eerst in of maak een account aan.' : 'Please log in or create an account first.', 'error');
        openModal('loginModal');
        return;
    }
    openModal(modalId);
}

// ============================================================
// UPDATE AUTH UI - Toon/hide knoppen op basis van login status
// ============================================================
function updateAuthUI() {
    const guest = document.getElementById('guestActions');
    const userA = document.getElementById('userActions');
    const dashLink = document.getElementById('dashNavLink');
    const dashLinkEn = document.getElementById('dashNavLinkEn');
    if (currentUser) {
        if (guest) guest.style.display = 'none';
        if (userA) {
            userA.classList.remove('hidden');
            userA.style.display = 'flex';
        }
        if (dashLink) dashLink.classList.remove('hidden');
        if (dashLinkEn) dashLinkEn.classList.remove('hidden');
        const avatar = document.getElementById('userAvatarBtn');
        if (avatar) avatar.textContent = initials(currentUser.firstName, currentUser.lastName);
    } else {
        if (guest) guest.style.display = 'flex';
        if (userA) {
            userA.classList.add('hidden');
            userA.style.display = 'none';
        }
        if (dashLink) dashLink.classList.add('hidden');
        if (dashLinkEn) dashLinkEn.classList.add('hidden');
    }
}

// ============================================================
// LANGUAGE
// ============================================================
function setLang(lang) {
    currentLang = lang;
    document.body.classList.toggle('lang-en', lang === 'en');
    const langNL = document.getElementById('langNL');
    const langEN = document.getElementById('langEN');
    if (langNL) langNL.classList.toggle('active', lang === 'nl');
    if (langEN) langEN.classList.toggle('active', lang === 'en');
    renderAll();
}

// ============================================================
// UTIL
// ============================================================
function uid(prefix) { return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function nowISO() { return new Date().toISOString(); }
function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(currentLang === 'nl' ? 'nl-NL' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}
function euro(n) { return '€' + Number(n).toLocaleString('nl-NL'); }
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function initials(first, last) { return ((first || '?')[0] + (last || '')[0]).toUpperCase(); }

function toast(msg, type) {
    const c = document.getElementById('toastContainer');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast' + (type === 'error' ? ' error' : '');
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateX(30px)';
        t.style.transition = 'all .3s';
        setTimeout(() => t.remove(), 300);
    }, 3200);
}

// ============================================================
// MODALS
// ============================================================
function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('show');
}
function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
}
document.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('show');
    }
});

function toggleMobileMenu() {
    const nav = document.getElementById('navLinks');
    if (!nav) return;
    nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
    if (nav.style.display === 'flex') {
        nav.style.position = 'absolute';
        nav.style.top = '64px';
        nav.style.left = '0';
        nav.style.right = '0';
        nav.style.background = 'rgba(6,9,18,0.98)';
        nav.style.flexDirection = 'column';
        nav.style.padding = '20px 28px';
        nav.style.borderBottom = '1px solid var(--border)';
        nav.style.gap = '16px';
    }
}

function setRegType(type) {
    regType = type;
    const flBtn = document.getElementById('regTypeFreelancer');
    const flBtnEn = document.getElementById('regTypeFreelancerEn');
    const clBtn = document.getElementById('regTypeClient');
    const clBtnEn = document.getElementById('regTypeClientEn');
    if (flBtn) flBtn.classList.toggle('active', type === 'freelancer');
    if (flBtnEn) flBtnEn.classList.toggle('active', type === 'freelancer');
    if (clBtn) clBtn.classList.toggle('active', type === 'client');
    if (clBtnEn) clBtnEn.classList.toggle('active', type === 'client');
    const roleGroup = document.getElementById('regRoleTitleGroup');
    const companyGroup = document.getElementById('regCompanyGroup');
    if (roleGroup) roleGroup.style.display = 'block';
    if (companyGroup) companyGroup.style.display = type === 'client' ? 'block' : 'none';
}

// ============================================================
// VIEW ROUTING
// ============================================================
function showView(view) {
    const views = ['home', 'jobs', 'categories', 'freelancers', 'pricing', 'jobdetail', 'freelancerdetail'];
    views.forEach(v => {
        const el = document.getElementById('view-' + v);
        if (el) el.classList.add('hidden');
    });
    const dash = document.getElementById('view-dashboard');
    if (dash) dash.classList.remove('show');

    if (view === 'dashboard') {
        if (!currentUser) {
            toast(currentLang === 'nl' ? 'Log eerst in.' : 'Please log in first.', 'error');
            openModal('loginModal');
            return;
        }
        if (dash) dash.classList.add('show');
        renderDashboard();
    } else {
        const el = document.getElementById('view-' + view);
        if (el) el.classList.remove('hidden');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));

    if (view === 'jobs') renderJobsView();
    if (view === 'categories') renderCategoriesView();
    if (view === 'freelancers') renderFreelancersView();
    if (view === 'home') renderHome();
}

// ============================================================
// RENDER: CATEGORY POPULATORS
// ============================================================
function populateCategorySelects() {
    const selects = ['heroCategorySelect', 'filterCategory', 'flFilterCategory', 'regCategory', 'jobCategory'];
    selects.forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const keepFirst = sel.options.length && sel.options[0].value === '';
        sel.innerHTML = keepFirst ? sel.options[0].outerHTML : '';
        CATEGORIES.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.icon + ' ' + cat.name;
            sel.appendChild(opt);
        });
    });
    populateJobSubcategory();
}

function populateJobSubcategory() {
    const catId = document.getElementById('jobCategory')?.value;
    const cat = CATEGORIES.find(c => c.id === catId) || CATEGORIES[0];
    const subSel = document.getElementById('jobSubcategory');
    if (subSel) {
        subSel.innerHTML = cat.sub.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    }
}

// ============================================================
// RENDER: HOME - Toont opdrachten en freelancers van ALLE gebruikers
// ============================================================
async function renderHome() {
    try {
        // Haal ALLE open opdrachten op van de database
        const [jobsData, usersData] = await Promise.all([
            apiGet('/jobs?status=open'),
            apiGet('/users?role=freelancer')
        ]);
        
        const jobs = jobsData || [];
        const freelancers = usersData || [];

        // Update statistieken
        const statJobs = document.getElementById('statJobs');
        const statFreelancers = document.getElementById('statFreelancers');
        const statCategories = document.getElementById('statCategories');
        if (statJobs) statJobs.textContent = jobs.length;
        if (statFreelancers) statFreelancers.textContent = freelancers.length;
        if (statCategories) statCategories.textContent = CATEGORIES.length;

        // Toon categorieën
        const catGrid = document.getElementById('homeCatGrid');
        if (catGrid) {
            catGrid.innerHTML = CATEGORIES.slice(0, 10).map(cat => catCardHtml(cat, jobs)).join('');
        }

        // Toon RECENTE opdrachten van ALLE gebruikers
        const jobGrid = document.getElementById('homeJobGrid');
        if (jobGrid) {
            const recentJobs = [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
            jobGrid.innerHTML = recentJobs.map(j => jobCardHtml(j)).join('') || emptyHtml('nl', 'Nog geen opdrachten.');
        }

        // Toon freelancers
        const flGrid = document.getElementById('homeFreelancerGrid');
        if (flGrid) {
            flGrid.innerHTML = freelancers.slice(0, 4).map(f => freelancerCardHtml(f)).join('');
        }
    } catch (error) {
        console.error('Error loading home data:', error);
        toast('Error loading data', 'error');
    }
}

function catCardHtml(cat, jobsList) {
    const count = (jobsList || []).filter(j => j.category === cat.id).length;
    return `
    <div class="cat-card" onclick="filterByCategory('${cat.id}')">
        <span class="icon">${cat.icon}</span>
        <h4>${escapeHtml(cat.name)}</h4>
        <div class="count">${count} ${currentLang === 'nl' ? 'opdrachten' : 'jobs'}</div>
    </div>`;
}

function emptyHtml(lang, msg) {
    return `<div class="empty-state"><div class="icon">🔍</div><p>${escapeHtml(msg)}</p></div>`;
}

function filterByCategory(catId) {
    showView('jobs');
    setTimeout(() => {
        const filter = document.getElementById('filterCategory');
        if (filter) filter.value = catId;
        applyJobFilters();
    }, 50);
}

// ============================================================
// RENDER: CATEGORIES VIEW
// ============================================================
async function renderCategoriesView() {
    try {
        const jobs = await apiGet('/jobs');
        const grid = document.getElementById('allCatGrid');
        if (!grid) return;
        grid.innerHTML = CATEGORIES.map(cat => {
            const count = jobs.filter(j => j.category === cat.id).length;
            return `
            <div class="cat-card" onclick="filterByCategory('${cat.id}')">
                <span class="icon">${cat.icon}</span>
                <h4>${escapeHtml(cat.name)}</h4>
                <div class="count">${count} ${currentLang === 'nl' ? 'opdrachten' : 'jobs'}</div>
                <div class="sub-list">${cat.sub.map(s => '• ' + escapeHtml(s)).join('<br>')}</div>
            </div>`;
        }).join('');
        grid.querySelectorAll('.cat-card').forEach(card => {
            card.addEventListener('mouseenter', () => card.classList.add('expanded'));
            card.addEventListener('mouseleave', () => card.classList.remove('expanded'));
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// ============================================================
// RENDER: JOBS - Toont ALLE opdrachten van ALLE gebruikers
// ============================================================
function jobCardHtml(job) {
    const cat = CATEGORIES.find(c => c.id === job.category);
    const statusClass = job.status === 'open' ? 'badge-open' : job.status === 'in_progress' ? 'badge-progress' : 'badge-closed';
    const statusLabelNl = job.status === 'open' ? 'Open' : job.status === 'in_progress' ? 'In uitvoering' : 'Afgerond';
    const statusLabelEn = job.status === 'open' ? 'Open' : job.status === 'in_progress' ? 'In progress' : 'Closed';
    return `
    <div class="job-card" onclick="openJobDetail('${job.id}')">
        <div class="job-card-top">
            <div>
                <div class="job-title">${escapeHtml(job.title)}</div>
                <div class="job-meta">
                    <span>${cat ? cat.icon : ''} ${escapeHtml(job.subcategory || (cat ? cat.name : ''))}</span>
                    <span>📍 ${escapeHtml(job.location)}</span>
                    <span>🕒 ${formatDate(job.createdAt)}</span>
                    <span class="badge-status ${statusClass}" data-lang="nl">${statusLabelNl}</span>
                    <span class="badge-status ${statusClass}" data-lang="en">${statusLabelEn}</span>
                </div>
            </div>
            <div class="budget-pill">${euro(job.budget)}${job.type === 'hourly' ? '<span style="font-size:10px;">/uur</span>' : ''}</div>
        </div>
        <div class="job-desc">${escapeHtml(job.description.slice(0, 140))}${job.description.length > 140 ? '...' : ''}</div>
        <div class="job-tags">${(job.skills || []).slice(0, 4).map(s => `<span class="tag">${escapeHtml(s)}</span>`).join('')}</div>
        <div class="job-footer">
            <span class="proposals-count">${currentLang === 'nl' ? 'Voorstellen' : 'Proposals'}</span>
            <span style="color:var(--cyan);font-size:11px;font-weight:700;">${currentLang === 'nl' ? 'Bekijk →' : 'View →'}</span>
        </div>
    </div>`;
}

async function renderJobsView() {
    populateCategorySelects();
    await applyJobFilters();
}

async function applyJobFilters() {
    const cat = document.getElementById('filterCategory')?.value;
    const budgetRange = document.getElementById('filterBudget')?.value;
    const type = document.getElementById('filterType')?.value;
    const remote = document.getElementById('filterRemote')?.value;
    const search = document.getElementById('filterSearch')?.value?.toLowerCase().trim();

    try {
        let url = '/jobs';
        const params = new URLSearchParams();
        if (cat) params.append('category', cat);
        if (type) params.append('type', type);
        if (remote) params.append('remote', remote);
        if (search) params.append('search', search);
        if (budgetRange) {
            const [min, max] = budgetRange.split('-').map(Number);
            params.append('minBudget', min);
            params.append('maxBudget', max);
        }
        if (params.toString()) url += '?' + params.toString();

        // Haal ALLE opdrachten op van de database (niet alleen van de ingelogde gebruiker)
        const jobs = await apiGet(url);
        const grid = document.getElementById('jobsListGrid');
        if (grid) {
            grid.innerHTML = jobs.map(j => jobCardHtml(j)).join('') || emptyHtml(currentLang, currentLang === 'nl' ? 'Geen opdrachten gevonden.' : 'No jobs found.');
        }
    } catch (error) {
        console.error('Error applying job filters:', error);
    }
}

function resetJobFilters() {
    const filterCategory = document.getElementById('filterCategory');
    const filterBudget = document.getElementById('filterBudget');
    const filterType = document.getElementById('filterType');
    const filterRemote = document.getElementById('filterRemote');
    const filterSearch = document.getElementById('filterSearch');
    if (filterCategory) filterCategory.value = '';
    if (filterBudget) filterBudget.value = '';
    if (filterType) filterType.value = '';
    if (filterRemote) filterRemote.value = '';
    if (filterSearch) filterSearch.value = '';
    applyJobFilters();
}

function runHeroSearch() {
    const cat = document.getElementById('heroCategorySelect')?.value;
    const q = document.getElementById('heroSearchInput')?.value;
    showView('jobs');
    setTimeout(() => {
        const filterCategory = document.getElementById('filterCategory');
        const filterSearch = document.getElementById('filterSearch');
        if (filterCategory) filterCategory.value = cat || '';
        if (filterSearch) filterSearch.value = q || '';
        applyJobFilters();
    }, 50);
}

// ============================================================
// JOB DETAIL - Bekijk een specifieke opdracht
// ============================================================
function openJobDetail(jobId) {
    currentJobDetailId = jobId;
    showView('jobdetail');
    renderJobDetail();
}

async function renderJobDetail() {
    try {
        const job = await apiGet(`/jobs/${currentJobDetailId}`);
        const container = document.getElementById('jobDetailContent');
        if (!job || !container) { 
            if (container) container.innerHTML = emptyHtml(currentLang, 'Opdracht niet gevonden.'); 
            return; 
        }
        
        const cat = CATEGORIES.find(c => c.id === job.category);
        const proposals = await apiGet(`/jobs/${currentJobDetailId}/proposals`);
        const isOwner = currentUser && currentUser.id === job.ownerId;
        const alreadyApplied = currentUser && proposals.some(p => p.freelancerId === currentUser.id);

        container.innerHTML = `
            <div class="job-card" style="cursor:default;">
                <div class="job-card-top">
                    <div>
                        <div class="job-title" style="font-size:22px;">${escapeHtml(job.title)}</div>
                        <div class="job-meta">
                            <span>${cat ? cat.icon : ''} ${escapeHtml(job.subcategory)}</span>
                            <span>📍 ${escapeHtml(job.location)} (${escapeHtml(job.remote)})</span>
                            <span>🕒 ${formatDate(job.createdAt)}</span>
                            <span>⏳ ${currentLang === 'nl' ? 'Deadline' : 'Deadline'}: ${job.deadline ? formatDate(job.deadline) : '-'}</span>
                        </div>
                    </div>
                    <div class="budget-pill" style="font-size:20px;">${euro(job.budget)}${job.type === 'hourly' ? '/uur' : ''}</div>
                </div>
                <div class="job-desc" style="font-size:14px;margin-top:20px;">${escapeHtml(job.description)}</div>
                <div class="job-tags" style="margin-top:16px;">${(job.skills || []).map(s => `<span class="tag">${escapeHtml(s)}</span>`).join('')}</div>

                <div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div class="fl-avatar" style="width:44px;height:44px;font-size:15px;margin:0;">${currentUser ? initials(currentUser.firstName, currentUser.lastName) : '?'}</div>
                        <div>
                            <div style="font-weight:700;font-size:13px;">${currentUser ? escapeHtml(currentUser.firstName + ' ' + currentUser.lastName) : 'Onbekend'}</div>
                            <div style="font-size:11px;color:var(--text-faint);">${currentUser ? escapeHtml(currentUser.location) : ''}</div>
                        </div>
                    </div>
                    ${!isOwner ? `<button class="btn btn-primary" onclick="requireAuthThen('proposalModal')" ${alreadyApplied ? 'disabled' : ''}>${alreadyApplied ? (currentLang === 'nl' ? 'Al gereageerd' : 'Already applied') : (currentLang === 'nl' ? 'Stuur voorstel' : 'Send proposal')}</button>` : `<span style="color:var(--text-faint);font-size:12px;">${currentLang === 'nl' ? 'Dit is jouw opdracht' : 'This is your job'}</span>`}
                </div>
            </div>

            <div style="margin-top:30px;">
                <h3 style="font-size:16px;margin-bottom:16px;">${proposals.length} ${currentLang === 'nl' ? 'Voorstellen' : 'Proposals'}</h3>
                <div style="display:flex;flex-direction:column;gap:12px;">
                    ${proposals.map(p => {
                        return `
                        <div class="job-card" style="cursor:default;padding:16px 20px;">
                            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                                <div style="display:flex;align-items:center;gap:10px;">
                                    <div class="fl-avatar" style="width:36px;height:36px;font-size:13px;margin:0;">${currentUser ? initials(currentUser.firstName, currentUser.lastName) : '?'}</div>
                                    <div>
                                        <div style="font-weight:700;font-size:12.5px;">${currentUser ? escapeHtml(currentUser.firstName + ' ' + currentUser.lastName) : 'Onbekend'}</div>
                                        <div style="font-size:10.5px;color:var(--text-faint);">${currentUser ? escapeHtml(currentUser.roleTitle) : ''}</div>
                                    </div>
                                </div>
                                <div style="font-weight:800;color:var(--cyan);">${euro(p.amount)}</div>
                            </div>
                            <div style="font-size:12.5px;color:var(--text-dim);margin-top:10px;">${escapeHtml(p.message)}</div>
                            ${isOwner && p.status === 'pending' ? `<div style="margin-top:12px;display:flex;gap:8px;"><button class="btn btn-primary btn-sm" onclick="respondProposal('${p.id}','accepted')">${currentLang === 'nl' ? 'Accepteren' : 'Accept'}</button><button class="btn btn-danger btn-sm" onclick="respondProposal('${p.id}','rejected')">${currentLang === 'nl' ? 'Afwijzen' : 'Reject'}</button></div>` :
                            `<div style="margin-top:10px;"><span class="badge-status ${p.status === 'accepted' ? 'badge-open' : p.status === 'rejected' ? 'badge-closed' : 'badge-progress'}">${p.status}</span></div>`}
                        </div>`;
                    }).join('') || emptyHtml(currentLang, currentLang === 'nl' ? 'Nog geen voorstellen.' : 'No proposals yet.')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading job detail:', error);
        const container = document.getElementById('jobDetailContent');
        if (container) container.innerHTML = emptyHtml(currentLang, 'Fout bij laden van opdracht.');
    }
}

async function respondProposal(proposalId, status) {
    try {
        await apiPut(`/proposals/${proposalId}`, { status });
        toast(status === 'accepted' ? (currentLang === 'nl' ? 'Voorstel geaccepteerd!' : 'Proposal accepted!') : (currentLang === 'nl' ? 'Voorstel afgewezen.' : 'Proposal rejected.'));
        renderJobDetail();
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function handleSubmitProposal() {
    const amount = Number(document.getElementById('proposalAmount')?.value);
    const timeline = document.getElementById('proposalTimeline')?.value?.trim();
    const message = document.getElementById('proposalMessage')?.value?.trim();
    const errEl = document.getElementById('proposalError');
    if (!amount || amount <= 0 || !message) {
        return showFormError(errEl, currentLang === 'nl' ? 'Vul een geldig bedrag en bericht in.' : 'Enter a valid amount and message.');
    }
    errEl.classList.remove('show');
    try {
        await apiPost('/proposals', {
            jobId: currentJobDetailId,
            amount,
            timeline,
            message
        });
        closeModal('proposalModal');
        const proposalAmount = document.getElementById('proposalAmount');
        const proposalTimeline = document.getElementById('proposalTimeline');
        const proposalMessage = document.getElementById('proposalMessage');
        if (proposalAmount) proposalAmount.value = '';
        if (proposalTimeline) proposalTimeline.value = '';
        if (proposalMessage) proposalMessage.value = '';
        toast(currentLang === 'nl' ? 'Voorstel verstuurd!' : 'Proposal sent!');
        renderJobDetail();
    } catch (error) {
        showFormError(errEl, error.message);
    }
}

async function handlePostJob() {
    const title = document.getElementById('jobTitle')?.value?.trim();
    const category = document.getElementById('jobCategory')?.value;
    const subcategory = document.getElementById('jobSubcategory')?.value;
    const description = document.getElementById('jobDescription')?.value?.trim();
    const type = document.getElementById('jobType')?.value;
    const budget = Number(document.getElementById('jobBudget')?.value);
    const location = document.getElementById('jobLocation')?.value?.trim();
    const remote = document.getElementById('jobRemote')?.value;
    const skills = document.getElementById('jobSkills')?.value?.split(',').map(s => s.trim()).filter(Boolean) || [];
    const deadline = document.getElementById('jobDeadline')?.value;
    const errEl = document.getElementById('jobError');

    if (!title || !description || !budget || budget <= 0 || !location) {
        return showFormError(errEl, currentLang === 'nl' ? 'Vul alle verplichte velden correct in.' : 'Please fill in all required fields correctly.');
    }
    errEl.classList.remove('show');

    try {
        await apiPost('/jobs', {
            title, category, subcategory, description, type, budget, location, remote, skills, deadline
        });
        closeModal('postJobModal');
        ['jobTitle', 'jobDescription', 'jobBudget', 'jobLocation', 'jobSkills', 'jobDeadline'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        toast(currentLang === 'nl' ? 'Opdracht geplaatst!' : 'Job posted!');
        showView('jobs');
    } catch (error) {
        showFormError(errEl, error.message);
    }
}

// ============================================================
// FREELANCERS - Bekijk ALLE freelancers
// ============================================================
function freelancerCardHtml(u) {
    const cat = CATEGORIES.find(c => c.id === u.category);
    return `
    <div class="freelancer-card" onclick="openFreelancerDetail('${u.id}')">
        <div class="fl-avatar">${initials(u.firstName, u.lastName)}</div>
        <div class="fl-name">${escapeHtml(u.firstName + ' ' + u.lastName)} ${u.verified ? '✅' : ''}</div>
        <div class="fl-role">${escapeHtml(u.roleTitle)}</div>
        <div class="fl-rating">${u.hourlyRate ? '€' + u.hourlyRate + '/uur' : ''}</div>
        <div class="job-tags" style="justify-content:center;">${(u.skills || []).slice(0, 3).map(s => `<span class="tag-v tag">${escapeHtml(s)}</span>`).join('')}</div>
        <div class="fl-stats">
            <span>📍 ${escapeHtml(u.location)}</span>
        </div>
    </div>`;
}

async function renderFreelancersView() {
    populateCategorySelects();
    await applyFreelancerFilters();
}

async function applyFreelancerFilters() {
    const cat = document.getElementById('flFilterCategory')?.value;
    const search = document.getElementById('flFilterSearch')?.value?.toLowerCase().trim();
    try {
        let url = '/users?role=freelancer';
        if (cat) url += `&category=${cat}`;
        if (search) url += `&search=${search}`;
        const freelancers = await apiGet(url);
        const grid = document.getElementById('freelancersGrid');
        if (grid) {
            grid.innerHTML = freelancers.map(f => freelancerCardHtml(f)).join('') || emptyHtml(currentLang, currentLang === 'nl' ? 'Geen freelancers gevonden.' : 'No freelancers found.');
        }
    } catch (error) {
        console.error('Error loading freelancers:', error);
    }
}

function openFreelancerDetail(userId) {
    currentFreelancerDetailId = userId;
    showView('freelancerdetail');
    renderFreelancerDetail();
}

async function renderFreelancerDetail() {
    try {
        const u = await apiGet(`/users/${currentFreelancerDetailId}`);
        const container = document.getElementById('freelancerDetailContent');
        if (!u || !container) { 
            if (container) container.innerHTML = emptyHtml(currentLang, 'Niet gevonden.'); 
            return; 
        }
        
        const cat = CATEGORIES.find(c => c.id === u.category);
        const reviews = await apiGet(`/users/${currentFreelancerDetailId}/reviews`);
        const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : null;

        container.innerHTML = `
        <div class="profile-grid">
            <div class="profile-card">
                <div class="profile-big-avatar">${initials(u.firstName, u.lastName)}</div>
                <h3>${escapeHtml(u.firstName + ' ' + u.lastName)} ${u.verified ? '✅' : ''}</h3>
                <p style="color:var(--violet);font-size:13px;margin:6px 0;">${escapeHtml(u.roleTitle)}</p>
                <p style="font-size:12px;color:var(--text-faint);">📍 ${escapeHtml(u.location)}</p>
                ${avgRating ? `<p class="stars" style="margin-top:10px;">★★★★★ <span style="color:var(--text-dim);">${avgRating} (${reviews.length})</span></p>` : ''}
                ${u.hourlyRate ? `<p style="margin-top:14px;font-size:20px;font-weight:800;color:var(--cyan);">${euro(u.hourlyRate)}<span style="font-size:11px;color:var(--text-faint);">/uur</span></p>` : ''}
                ${currentUser && currentUser.id !== u.id ? `<button class="btn btn-primary btn-block" style="margin-top:16px;" onclick="openChatWith('${u.id}')">${currentLang === 'nl' ? 'Bericht sturen' : 'Send message'}</button>` : ''}
            </div>
            <div>
                <div class="job-card" style="cursor:default;margin-bottom:16px;">
                    <h4 style="margin-bottom:10px;">${currentLang === 'nl' ? 'Over' : 'About'}</h4>
                    <p style="color:var(--text-dim);font-size:13px;line-height:1.7;">${escapeHtml(u.bio) || (currentLang === 'nl' ? 'Geen bio toegevoegd.' : 'No bio added.')}</p>
                    <div class="job-tags" style="margin-top:14px;">${(u.skills || []).map(s => `<span class="tag">${escapeHtml(s)}</span>`).join('')}</div>
                    <p style="margin-top:14px;font-size:12px;color:var(--text-faint);">${cat ? cat.icon : ''} ${cat ? escapeHtml(cat.name) : ''}</p>
                </div>
                <div class="job-card" style="cursor:default;">
                    <h4 style="margin-bottom:14px;">${currentLang === 'nl' ? 'Reviews' : 'Reviews'} (${reviews.length})</h4>
                    ${reviews.map(r => {
                        return `<div class="review-item">
                            <div style="display:flex;justify-content:space-between;">
                                <strong style="font-size:12.5px;">${escapeHtml(u.firstName + ' ' + u.lastName)}</strong>
                                <span class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                            </div>
                            <p style="font-size:12px;color:var(--text-dim);margin-top:6px;">${escapeHtml(r.text)}</p>
                            <p style="font-size:10px;color:var(--text-faint);margin-top:4px;">${formatDate(r.createdAt)}</p>
                        </div>`;
                    }).join('') || emptyHtml(currentLang, currentLang === 'nl' ? 'Nog geen reviews.' : 'No reviews yet.')}
                </div>
            </div>
        </div>`;
    } catch (error) {
        console.error('Error loading freelancer detail:', error);
        const container = document.getElementById('freelancerDetailContent');
        if (container) container.innerHTML = emptyHtml(currentLang, 'Fout bij laden.');
    }
}

// ============================================================
// DASHBOARD - Alleen voor ingelogde gebruikers
// ============================================================
async function renderDashboard() {
    if (!currentUser) return;
    const subtitle = document.getElementById('dashSubtitle');
    if (subtitle) {
        subtitle.textContent = currentLang === 'nl'
            ? `Ingelogd als ${currentUser.firstName} ${currentUser.lastName} · ${currentUser.role === 'freelancer' ? 'ZZP\'er' : 'Opdrachtgever'}`
            : `Logged in as ${currentUser.firstName} ${currentUser.lastName} · ${currentUser.role === 'freelancer' ? 'Freelancer' : 'Client'}`;
    }

    try {
        const [myJobs, myProposals, myReviews] = await Promise.all([
            apiGet('/jobs'),
            apiGet('/proposals'),
            apiGet(`/users/${currentUser.id}/reviews`)
        ]);

        const jobs = myJobs || [];
        const proposals = myProposals || [];
        const reviews = myReviews || [];
        const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : '-';

        const statCards = document.getElementById('dashStatCards');
        if (statCards) {
            if (currentUser.role === 'client') {
                const userJobs = jobs.filter(j => j.ownerId === currentUser.id);
                const receivedProposals = proposals.filter(p => userJobs.some(j => j.id === p.jobId));
                statCards.innerHTML = `
                    <div class="stat-card"><div class="num">${userJobs.length}</div><div class="lbl">${currentLang === 'nl' ? 'Geplaatste opdrachten' : 'Posted jobs'}</div></div>
                    <div class="stat-card"><div class="num">${userJobs.filter(j => j.status === 'open').length}</div><div class="lbl">${currentLang === 'nl' ? 'Open' : 'Open'}</div></div>
                    <div class="stat-card"><div class="num">${receivedProposals.length}</div><div class="lbl">${currentLang === 'nl' ? 'Ontvangen voorstellen' : 'Received proposals'}</div></div>
                    <div class="stat-card"><div class="num">${userJobs.filter(j => j.status === 'in_progress').length}</div><div class="lbl">${currentLang === 'nl' ? 'In uitvoering' : 'In progress'}</div></div>`;
            } else {
                const sentProposals = proposals.filter(p => p.freelancerId === currentUser.id);
                statCards.innerHTML = `
                    <div class="stat-card"><div class="num">${sentProposals.length}</div><div class="lbl">${currentLang === 'nl' ? 'Voorstellen verstuurd' : 'Proposals sent'}</div></div>
                    <div class="stat-card"><div class="num">${sentProposals.filter(p => p.status === 'accepted').length}</div><div class="lbl">${currentLang === 'nl' ? 'Geaccepteerd' : 'Accepted'}</div></div>
                    <div class="stat-card"><div class="num">${avgRating}</div><div class="lbl">${currentLang === 'nl' ? 'Gem. beoordeling' : 'Avg. rating'}</div></div>
                    <div class="stat-card"><div class="num">${reviews.length}</div><div class="lbl">${currentLang === 'nl' ? 'Reviews' : 'Reviews'}</div></div>`;
            }
        }

        renderActivityFeed(jobs, proposals);
        renderMyJobsTable(jobs);
        renderProposalsTable(proposals);
        renderChatList();
        renderProfileTab();
        renderReviewsTab(reviews);
    } catch (error) {
        console.error('Error loading dashboard:', error);
        toast('Error loading dashboard data', 'error');
    }
}

function switchDashTab(tab) {
    document.querySelectorAll('.dash-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.dash-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('tab-' + tab);
    if (panel) panel.classList.add('active');
}

function renderActivityFeed(jobs, proposals) {
    const myJobs = jobs.filter(j => j.ownerId === currentUser.id).map(j => j.id);
    const relevantProposals = proposals.filter(p => p.freelancerId === currentUser.id || myJobs.includes(p.jobId));
    const sorted = [...relevantProposals].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
    const feed = document.getElementById('activityFeed');
    if (!feed) return;
    if (sorted.length === 0) {
        feed.innerHTML = `<p style="color:var(--text-faint);font-size:12.5px;">${currentLang === 'nl' ? 'Nog geen activiteit.' : 'No activity yet.'}</p>`;
        return;
    }
    feed.innerHTML = sorted.map(p => {
        const job = jobs.find(j => j.id === p.jobId);
        return `<div style="padding:10px 0;border-bottom:1px solid var(--border);font-size:12.5px;color:var(--text-dim);">
            ${p.freelancerId === currentUser.id ? (currentLang === 'nl' ? 'Je stuurde een voorstel voor' : 'You sent a proposal for') : (currentLang === 'nl' ? 'Nieuw voorstel ontvangen voor' : 'New proposal received for')}
            <strong style="color:var(--text);">${job ? escapeHtml(job.title) : '?'}</strong> — <span class="badge-status ${p.status === 'accepted' ? 'badge-open' : p.status === 'rejected' ? 'badge-closed' : 'badge-progress'}">${p.status}</span>
        </div>`;
    }).join('');
}

function renderMyJobsTable(jobs) {
    const userJobs = jobs.filter(j => j.ownerId === currentUser.id);
    const tbody = document.querySelector('#myJobsTable tbody');
    if (!tbody) return;
    const cat = id => CATEGORIES.find(c => c.id === id);
    tbody.innerHTML = userJobs.map(j => {
        return `<tr>
            <td>${escapeHtml(j.title)}</td>
            <td>${cat(j.category) ? cat(j.category).icon : ''} ${escapeHtml(j.subcategory || '')}</td>
            <td>${euro(j.budget)}${j.type === 'hourly' ? '/uur' : ''}</td>
            <td>0</td>
            <td><span class="badge-status ${j.status === 'open' ? 'badge-open' : j.status === 'in_progress' ? 'badge-progress' : 'badge-closed'}">${j.status}</span></td>
            <td><button class="btn btn-ghost btn-sm" onclick="openJobDetail('${j.id}')">${currentLang === 'nl' ? 'Bekijk' : 'View'}</button></td>
        </tr>`;
    }).join('') || `<tr><td colspan="6" style="text-align:center;color:var(--text-faint);">${currentLang === 'nl' ? 'Nog geen opdrachten geplaatst.' : 'No jobs posted yet.'}</td></tr>`;
}

function renderProposalsTable(proposals) {
    const userProposals = proposals.filter(p => p.freelancerId === currentUser.id);
    const tbody = document.querySelector('#proposalsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = userProposals.map(p => {
        return `<tr>
            <td>?</td>
            <td>${euro(p.amount)}</td>
            <td>${escapeHtml(p.message.slice(0, 50))}...</td>
            <td><span class="badge-status ${p.status === 'accepted' ? 'badge-open' : p.status === 'rejected' ? 'badge-closed' : 'badge-progress'}">${p.status}</span></td>
            <td>${formatDate(p.createdAt)}</td>
        </tr>`;
    }).join('') || `<tr><td colspan="5" style="text-align:center;color:var(--text-faint);">${currentLang === 'nl' ? 'Nog geen voorstellen verstuurd.' : 'No proposals sent yet.'}</td></tr>`;
}

// ============================================================
// PROFILE TAB
// ============================================================
function renderProfileTab() {
    const u = currentUser;
    const cat = CATEGORIES.find(c => c.id === u.category);
    const container = document.getElementById('profileGridContent');
    if (!container) return;
    container.innerHTML = `
        <div class="profile-card">
            <div class="profile-big-avatar">${initials(u.firstName, u.lastName)}</div>
            <h3>${escapeHtml(u.firstName + ' ' + u.lastName)}</h3>
            <p style="color:var(--violet);font-size:13px;margin:6px 0;">${escapeHtml(u.roleTitle)}</p>
            <p style="font-size:11.5px;color:var(--text-faint);">${cat ? cat.icon + ' ' + escapeHtml(cat.name) : ''}</p>
        </div>
        <div class="job-card" style="cursor:default;">
            <h4 style="margin-bottom:16px;">${currentLang === 'nl' ? 'Profiel bewerken' : 'Edit profile'}</h4>
            <div class="form-row">
                <div class="form-group"><label>${currentLang === 'nl' ? 'Voornaam' : 'First name'}</label><input type="text" id="pfFirstName" value="${escapeHtml(u.firstName)}"></div>
                <div class="form-group"><label>${currentLang === 'nl' ? 'Achternaam' : 'Last name'}</label><input type="text" id="pfLastName" value="${escapeHtml(u.lastName)}"></div>
            </div>
            <div class="form-group"><label>${currentLang === 'nl' ? 'Functietitel' : 'Job title'}</label><input type="text" id="pfRoleTitle" value="${escapeHtml(u.roleTitle)}"></div>
            <div class="form-group"><label>${currentLang === 'nl' ? 'Locatie' : 'Location'}</label><input type="text" id="pfLocation" value="${escapeHtml(u.location)}"></div>
            ${u.role === 'freelancer' ? `
            <div class="form-group"><label>${currentLang === 'nl' ? 'Uurtarief (€)' : 'Hourly rate (€)'}</label><input type="number" id="pfHourlyRate" value="${u.hourlyRate || 0}"></div>
            <div class="form-group"><label>${currentLang === 'nl' ? 'Skills (komma-gescheiden)' : 'Skills (comma-separated)'}</label><input type="text" id="pfSkills" value="${escapeHtml((u.skills || []).join(', '))}"></div>
            ` : `
            <div class="form-group"><label>${currentLang === 'nl' ? 'Bedrijfsnaam' : 'Company name'}</label><input type="text" id="pfCompany" value="${escapeHtml(u.company || '')}"></div>
            `}
            <div class="form-group"><label>${currentLang === 'nl' ? 'Bio' : 'Bio'}</label><textarea id="pfBio">${escapeHtml(u.bio || '')}</textarea></div>
            <button class="btn btn-primary" onclick="saveProfile()">${currentLang === 'nl' ? 'Opslaan' : 'Save'}</button>
        </div>
    `;
}

async function saveProfile() {
    try {
        const data = {
            firstName: document.getElementById('pfFirstName').value.trim(),
            lastName: document.getElementById('pfLastName').value.trim(),
            roleTitle: document.getElementById('pfRoleTitle').value.trim(),
            location: document.getElementById('pfLocation').value.trim(),
            bio: document.getElementById('pfBio').value.trim()
        };
        
        if (currentUser.role === 'freelancer') {
            data.hourlyRate = Number(document.getElementById('pfHourlyRate').value) || 0;
            data.skills = document.getElementById('pfSkills').value.split(',').map(s => s.trim()).filter(Boolean);
        } else {
            data.company = document.getElementById('pfCompany').value.trim();
        }
        
        const result = await apiPut('/users/me', data);
        currentUser = result.user;
        updateAuthUI();
        toast(currentLang === 'nl' ? 'Profiel opgeslagen!' : 'Profile saved!');
        renderProfileTab();
    } catch (error) {
        toast(error.message, 'error');
    }
}

// ============================================================
// REVIEWS TAB
// ============================================================
function renderReviewsTab(reviews) {
    const panel = document.getElementById('reviewsPanel');
    if (!panel) return;
    panel.innerHTML = `<h3 style="margin-bottom:14px;font-size:14px;">${currentLang === 'nl' ? 'Ontvangen reviews' : 'Received reviews'}</h3>` +
        (reviews.map(r => {
            return `<div class="review-item">
                <div style="display:flex;justify-content:space-between;">
                    <strong style="font-size:12.5px;">${escapeHtml(currentUser.firstName + ' ' + currentUser.lastName)}</strong>
                    <span class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                </div>
                <p style="font-size:12px;color:var(--text-dim);margin-top:6px;">${escapeHtml(r.text)}</p>
                <p style="font-size:10px;color:var(--text-faint);margin-top:4px;">${formatDate(r.createdAt)}</p>
            </div>`;
        }).join('') || `<p style="color:var(--text-faint);font-size:12.5px;">${currentLang === 'nl' ? 'Nog geen reviews ontvangen.' : 'No reviews received yet.'}</p>`);
}

let reviewTargetUserId = null;

function openReviewModalFor(userId, jobId) {
    reviewTargetUserId = userId;
    currentJobDetailId = jobId || currentJobDetailId;
    openModal('reviewModal');
}

async function handleSubmitReview() {
    const rating = Number(document.getElementById('reviewRating').value);
    const text = document.getElementById('reviewText').value.trim();
    const errEl = document.getElementById('reviewError');
    if (!text) { return showFormError(errEl, currentLang === 'nl' ? 'Schrijf een korte review.' : 'Write a short review.'); }
    errEl.classList.remove('show');
    try {
        await apiPost('/reviews', {
            targetId: reviewTargetUserId,
            jobId: currentJobDetailId,
            rating,
            text
        });
        closeModal('reviewModal');
        document.getElementById('reviewText').value = '';
        toast(currentLang === 'nl' ? 'Review geplaatst!' : 'Review posted!');
        renderReviewsTab();
    } catch (error) {
        showFormError(errEl, error.message);
    }
}

// ============================================================
// CHAT / MESSAGES
// ============================================================
async function renderChatList() {
    try {
        const conversations = await apiGet('/messages/conversations');
        const list = document.getElementById('chatList');
        if (!list) return;
        if (conversations.length === 0) {
            list.innerHTML = `<div class="empty-state"><p style="font-size:11.5px;">${currentLang === 'nl' ? 'Geen gesprekken' : 'No conversations'}</p></div>`;
            return;
        }
        list.innerHTML = conversations.map(c => {
            const isActive = c.peerId === activeChatPeerId;
            return `<div class="chat-item ${isActive ? 'active' : ''}" onclick="openChatWith('${c.peerId}')">
                <div class="chat-item-name">${escapeHtml(c.peerName)} ${c.unread > 0 ? '🔴' : ''}</div>
                <div class="chat-item-preview">${escapeHtml(c.lastMessage)}</div>
            </div>`;
        }).join('');
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

async function openChatWith(peerId) {
    activeChatPeerId = peerId;
    switchDashTab('messages');
    showView('dashboard');
    setTimeout(async () => {
        await renderChatList();
        await renderChatMessages();
    }, 100);
}

async function renderChatMessages() {
    const box = document.getElementById('chatMessages');
    if (!box) return;
    if (!activeChatPeerId) {
        box.innerHTML = `<div class="empty-state"><div class="icon">💬</div><p>${currentLang === 'nl' ? 'Selecteer een gesprek' : 'Select a conversation'}</p></div>`;
        return;
    }
    try {
        const messages = await apiGet(`/messages?peerId=${activeChatPeerId}`);
        box.innerHTML = messages.map(m => 
            `<div class="msg-bubble ${m.from === currentUser.id ? 'msg-out' : 'msg-in'}">${escapeHtml(m.text)}</div>`
        ).join('') ||
        `<div class="empty-state"><p style="font-size:11.5px;">${currentLang === 'nl' ? 'Nog geen berichten' : 'No messages yet'}</p></div>`;
        box.scrollTop = box.scrollHeight;
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text || !activeChatPeerId) return;
    try {
        await apiPost('/messages', {
            to: activeChatPeerId,
            text
        });
        input.value = '';
        await renderChatMessages();
        await renderChatList();
    } catch (error) {
        toast(error.message, 'error');
    }
}

// ============================================================
// INIT - Start de applicatie
// ============================================================
function renderAll() {
    populateCategorySelects();
    renderHome();
    updateAuthUI();
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Abel123 platform starting...');
    console.log('📡 API_BASE:', API_BASE);
    await checkSession();
    populateCategorySelects();
    renderHome();
    showView('home');
});
