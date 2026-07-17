/* ============================================================
   WERKNEXUS :: ZZP & FREELANCE PLATFORM
   Full-stack version with Flask backend
   ============================================================ */

const API_BASE = 'http://localhost:5000/api';

// Categories (same as before)
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

/* ---------------- STATE ---------------- */
let currentLang = 'nl';
let currentUser = null;
let currentJobDetailId = null;
let currentFreelancerDetailId = null;
let activeChatPeerId = null;
let regType = 'freelancer';
let accessToken = null;

/* ---------------- API HELPERS ---------------- */
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

/* ---------------- AUTH ---------------- */
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
            return true;
        } catch (error) {
            clearSession();
            currentUser = null;
            return false;
        }
    }
    currentUser = null;
    return false;
}

async function handleRegister() {
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
        
        currentUser = result.user;
        closeModal('registerModal');
        toast(currentLang === 'nl' ? `Welkom, ${firstName}! Je account is aangemaakt.` : `Welcome, ${firstName}! Your account has been created.`);
        showView('dashboard');
    } catch (error) {
        showFormError(errEl, error.message);
    }
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');

    if (!email || !password) {
        return showFormError(errEl, currentLang === 'nl' ? 'Vul e-mail en wachtwoord in.' : 'Enter email and password.');
    }
    errEl.classList.remove('show');

    try {
        const result = await apiPost('/auth/login', { email, password });
        setSession(result.user.id, result.access_token);
        currentUser = result.user;
        updateAuthUI();
        closeModal('loginModal');
        toast(currentLang === 'nl' ? `Welkom terug, ${currentUser.firstName}!` : `Welcome back, ${currentUser.firstName}!`);
        showView('dashboard');
    } catch (error) {
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

/* ---------------- UPDATE AUTH UI ---------------- */
function updateAuthUI() {
    const guest = document.getElementById('guestActions');
    const userA = document.getElementById('userActions');
    const dashLink = document.getElementById('dashNavLink');
    const dashLinkEn = document.getElementById('dashNavLinkEn');
    if (currentUser) {
        guest.style.display = 'none';
        userA.classList.remove('hidden');
        userA.style.display = 'flex';
        dashLink.classList.remove('hidden');
        dashLinkEn.classList.remove('hidden');
        document.getElementById('userAvatarBtn').textContent = initials(currentUser.firstName, currentUser.lastName);
    } else {
        guest.style.display = 'flex';
        userA.classList.add('hidden');
        dashLink.classList.add('hidden');
        dashLinkEn.classList.add('hidden');
    }
}

/* ---------------- LANGUAGE ---------------- */
function setLang(lang) {
    currentLang = lang;
    document.body.classList.toggle('lang-en', lang === 'en');
    document.getElementById('langNL').classList.toggle('active', lang === 'nl');
    document.getElementById('langEN').classList.toggle('active', lang === 'en');
    renderAll();
}

/* ---------------- UTIL ---------------- */
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

/* ---------------- MODALS ---------------- */
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
document.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('show');
    }
});

function toggleMobileMenu() {
    const nav = document.getElementById('navLinks');
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

/* ---------------- VIEW ROUTING ---------------- */
function showView(view) {
    const views = ['home', 'jobs', 'categories', 'freelancers', 'pricing', 'jobdetail', 'freelancerdetail'];
    views.forEach(v => {
        const el = document.getElementById('view-' + v);
        if (el) el.classList.add('hidden');
    });
    document.getElementById('view-dashboard').classList.remove('show');

    if (view === 'dashboard') {
        if (!currentUser) {
            toast(currentLang === 'nl' ? 'Log eerst in.' : 'Please log in first.', 'error');
            openModal('loginModal');
            return;
        }
        document.getElementById('view-dashboard').classList.add('show');
        renderDashboard();
    } else {
        document.getElementById('view-' + view).classList.remove('hidden');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));

    if (view === 'jobs') renderJobsView();
    if (view === 'categories') renderCategoriesView();
    if (view === 'freelancers') renderFreelancersView();
    if (view === 'home') renderHome();
}

/* ---------------- RENDER: CATEGORY POPULATORS ---------------- */
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
    const catId = document.getElementById('jobCategory').value;
    const cat = CATEGORIES.find(c => c.id === catId) || CATEGORIES[0];
    const subSel = document.getElementById('jobSubcategory');
    subSel.innerHTML = cat.sub.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
}

/* ---------------- RENDER: HOME ---------------- */
async function renderHome() {
    try {
        const [jobsData, usersData] = await Promise.all([
            apiGet('/jobs?status=open'),
            apiGet('/users?role=freelancer')
        ]);
        
        const jobs = jobsData || [];
        const freelancers = usersData || [];

        document.getElementById('statJobs').textContent = jobs.length;
        document.getElementById('statFreelancers').textContent = freelancers.length;
        document.getElementById('statCategories').textContent = CATEGORIES.length;

        const catGrid = document.getElementById('homeCatGrid');
        catGrid.innerHTML = CATEGORIES.slice(0, 10).map(cat => catCardHtml(cat, jobs)).join('');

        const jobGrid = document.getElementById('homeJobGrid');
        const recentJobs = [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
        jobGrid.innerHTML = recentJobs.map(j => jobCardHtml(j)).join('') || emptyHtml('nl', 'Nog geen opdrachten.');

        const flGrid = document.getElementById('homeFreelancerGrid');
        flGrid.innerHTML = freelancers.slice(0, 4).map(f => freelancerCardHtml(f)).join('');
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
        document.getElementById('filterCategory').value = catId;
        applyJobFilters();
    }, 50);
}

/* ---------------- RENDER: CATEGORIES VIEW ---------------- */
async function renderCategoriesView() {
    try {
        const jobs = await apiGet('/jobs');
        const grid = document.getElementById('allCatGrid');
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

/* ---------------- RENDER: JOBS ---------------- */
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
    const cat = document.getElementById('filterCategory').value;
    const budgetRange = document.getElementById('filterBudget').value;
    const type = document.getElementById('filterType').value;
    const remote = document.getElementById('filterRemote').value;
    const search = document.getElementById('filterSearch').value.toLowerCase().trim();

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

        const jobs = await apiGet(url);
        document.getElementById('jobsListGrid').innerHTML = jobs.map(j => jobCardHtml(j)).join('') || emptyHtml(currentLang, currentLang === 'nl' ? 'Geen opdrachten gevonden.' : 'No jobs found.');
    } catch (error) {
        console.error('Error applying job filters:', error);
    }
}

function resetJobFilters() {
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterBudget').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterRemote').value = '';
    document.getElementById('filterSearch').value = '';
    applyJobFilters();
}

function runHeroSearch() {
    const cat = document.getElementById('heroCategorySelect').value;
    const q = document.getElementById('heroSearchInput').value;
    showView('jobs');
    setTimeout(() => {
        document.getElementById('filterCategory').value = cat;
        document.getElementById('filterSearch').value = q;
        applyJobFilters();
    }, 50);
}

/* ---------------- JOB DETAIL ---------------- */
function openJobDetail(jobId) {
    currentJobDetailId = jobId;
    showView('jobdetail');
    renderJobDetail();
}

async function renderJobDetail() {
    try {
        const job = await apiGet(`/jobs/${currentJobDetailId}`);
        const container = document.getElementById('jobDetailContent');
        if (!job) { container.innerHTML = emptyHtml(currentLang, 'Opdracht niet gevonden.'); return; }
        
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
                                        <div style="font-weight:700;font-size:12.5px;">${currentUser ? escapeHtml(currentUser.firstName + ' ' + currentUser.last
