// ============================================================
// assets/js/api.js — Centralized API utility
// ============================================================

// Dynamic base — works on localhost AND any deployed domain/port
const API_BASE = window.location.origin + '/api';

/**
 * Generic fetch wrapper with session credentials
 */
async function apiCall(endpoint, method = 'GET', body = null) {
    const opts = {
        method,
        credentials: 'include',   // send session cookies
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) opts.body = JSON.stringify(body);

    const res  = await fetch(`${API_BASE}${endpoint}`, opts);
    const data = await res.json();

    if (!res.ok && res.status === 401) {
        // Session expired — redirect to login
        const role = window.location.pathname.includes('student') ? 'student' : 'admin';
        window.location.href = role === 'student' ? '/student/login.html' : '/admin/login.html';
    }

    return data;
}

// ── Auth helpers ─────────────────────────────────────────────
const Auth = {
    async adminLogin(username, password) {
        return apiCall('/auth/admin/login', 'POST', { username, password });
    },
    async adminLogout() {
        return apiCall('/auth/admin/logout', 'POST');
    },
    async studentLogin(student_id, password) {
        return apiCall('/auth/student/login', 'POST', { student_id, password });
    },
    async studentLogout() {
        return apiCall('/auth/student/logout', 'POST');
    },
    async getSession() {
        return apiCall('/auth/session');
    }
};

// ── Student API ───────────────────────────────────────────────
const StudentAPI = {
    getAll:        (params = '') => apiCall(`/students?${params}`),
    getById:       (id)         => apiCall(`/students/${id}`),
    add:           (data)       => apiCall('/students', 'POST', data),
    update:        (id, data)   => apiCall(`/students/${id}`, 'PUT', data),
    delete:        (id)         => apiCall(`/students/${id}`, 'DELETE'),
    getDepts:      ()           => apiCall('/students/departments'),
    getMyProfile:  ()           => apiCall('/students/me/profile'),
};

// ── Course API ────────────────────────────────────────────────
const CourseAPI = {
    getAll:   (params = '') => apiCall(`/courses?${params}`),
    getById:  (id)          => apiCall(`/courses/${id}`),
    add:      (data)        => apiCall('/courses', 'POST', data),
    update:   (id, data)    => apiCall(`/courses/${id}`, 'PUT', data),
    delete:   (id)          => apiCall(`/courses/${id}`, 'DELETE'),
};

// ── Result API ────────────────────────────────────────────────
const ResultAPI = {
    getAll:      (params = '') => apiCall(`/results/all?${params}`),
    getByStudent:(id)          => apiCall(`/results/student/${id}`),
    getMyResults:()            => apiCall('/results/me'),
    add:         (data)        => apiCall('/results', 'POST', data),
    update:      (id, data)    => apiCall(`/results/${id}`, 'PUT', data),
    delete:      (id)          => apiCall(`/results/${id}`, 'DELETE'),
};

// ── Fee API ───────────────────────────────────────────────────
const FeeAPI = {
    getAll:         (params = '') => apiCall(`/fees?${params}`),
    getByStudent:   (id)          => apiCall(`/fees/student/${id}`),
    getMyFees:      ()            => apiCall('/fees/my-fees'),
    add:            (data)        => apiCall('/fees/add-fee', 'POST', data),
    update:         (id, data)    => apiCall(`/fees/update-fee/${id}`, 'PUT', data),
    pay:            (data)        => apiCall('/fees/pay-fee', 'POST', data),
    delete:         (id)          => apiCall(`/fees/delete-fee/${id}`, 'DELETE'),
    getHistory:     (feeId)       => apiCall(`/fees/history/${feeId}`),
    getDashStats:   ()            => apiCall('/fees/dashboard-stats'),
};

// ── UI Helpers ────────────────────────────────────────────────
function showToast(message, type = 'success') {
    const colors = {
        success: 'bg-emerald-600',
        error:   'bg-red-600',
        warning: 'bg-amber-500',
        info:    'bg-blue-600'
    };
    const toast = document.createElement('div');
    toast.className = `fixed top-5 right-5 z-50 px-5 py-3 rounded-lg text-white text-sm font-medium shadow-xl
                       flex items-center gap-2 transition-all duration-300 ${colors[type] || colors.info}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
        <span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
}

function formatBDT(amount) {
    return `৳${parseFloat(amount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
}

function statusBadge(status) {
    const cfg = {
        'Paid':    'bg-emerald-100 text-emerald-800 border border-emerald-200',
        'Partial': 'bg-amber-100 text-amber-800 border border-amber-200',
        'Unpaid':  'bg-red-100 text-red-800 border border-red-200',
        'Active':  'bg-blue-100 text-blue-800 border border-blue-200',
        'Inactive':'bg-gray-100 text-gray-600 border border-gray-200',
    };
    return `<span class="px-2 py-0.5 rounded-full text-xs font-semibold ${cfg[status] || 'bg-gray-100 text-gray-700'}">${status}</span>`;
}

function confirmDelete(message = 'Are you sure you want to delete this record?') {
    return confirm(message);
}
