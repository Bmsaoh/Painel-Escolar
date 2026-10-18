// ===== DOCUMENT READY =====
document.addEventListener('DOMContentLoaded', function() {
    initLoginPage();
    initSidebar();
    initDropdowns();
    initPageTransitions();
    initDataTable();
    initForms();
    loadPageSpecific();
});

// ===== LOGIN PAGE =====
function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');

    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            icon.classList.toggle('bi-eye');
            icon.classList.toggle('bi-eye-slash');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            const passwordInput = this.querySelector('input[type="password"]');
            const submitBtn = this.querySelector('button[type="submit"]');

            const email = emailInput ? emailInput.value : '';
            const password = passwordInput ? passwordInput.value : '';

            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Entrando...';
            submitBtn.disabled = true;

            try {
                if (window.api) {
                    await window.api.login(email, password);
                }
            } catch (error) {
                console.warn('Login via API falhou, usando modo simulado:', error.message);
            }

            window.location.href = 'dashboard.html';
        });
    }
}

// ===== SIDEBAR TOGGLE =====
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (sidebar && sidebar.classList.contains('show')) {
            if (!sidebar.contains(e.target) && sidebarToggle && !sidebarToggle.contains(e.target)) {
                sidebar.classList.remove('show');
            }
        }
    });

    // Update main content when sidebar collapses on desktop
    if (mainContent) {
        const observer = new MutationObserver(function() {
            // This ensures content reflows properly
        });
    }
}

// ===== DROPDOWNS =====
function initDropdowns() {
    // Render notifications in dropdown menus if present
    const notificationDropdowns = document.querySelectorAll('[id^="notificationDropdown"]');
    notificationDropdowns.forEach(function(dropdown) {
        renderNotifications(dropdown.id);
    });
}

// ===== PAGE TRANSITIONS =====
function initPageTransitions() {
    // Add transition class to main content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.classList.add('page-enter');
        requestAnimationFrame(function() {
            mainContent.classList.add('page-enter-active');
            mainContent.classList.remove('page-enter');
        });
    }

    // Smooth page transitions on navigation
    const links = document.querySelectorAll('a[href]');
    links.forEach(function(link) {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('http') && !href.startsWith('mailto') && !href.startsWith('tel')) {
            link.addEventListener('click', function(e) {
                // Only add transition for internal navigation
                if (!link.closest('.dropdown-menu')) {
                    mainContent.classList.remove('page-enter-active');
                    mainContent.classList.add('page-enter');
                }
            });
        }
    });
}

// ===== DATA TABLE =====
function initDataTable() {
    // Select all checkbox
    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.row-selector');
            checkboxes.forEach(cb => cb.checked = this.checked);
        });
    }

    // Update select all when individual checkboxes change
    document.addEventListener('change', function(e) {
        if (e.target && e.target.classList.contains('row-selector')) {
            const all = document.querySelectorAll('.row-selector');
            const checked = document.querySelectorAll('.row-selector:checked');
            const selectAllCheckbox = document.getElementById('selectAll');
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = all.length === checked.length;
                selectAllCheckbox.indeterminate = checked.length > 0 && checked.length < all.length;
            }
        }
    });
}

// ===== FORMS =====
function initForms() {
    // Initialize form validations and handlers
    document.querySelectorAll('form').forEach(function(form) {
        // Add loading state on submit
        form.addEventListener('submit', function(e) {
            if (form.checkValidity && !form.checkValidity()) return;
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
                submitBtn.disabled = true;
                setTimeout(function() {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }, 1500);
            }
        });
    });
}

// ===== PAGE-SPECIFIC INITIALIZATION =====
function loadPageSpecific() {
    const page = window.location.pathname.split('/').pop();
    
    switch(page) {
        case 'dashboard.html':
            loadDashboard();
            break;
        case 'students.html':
            renderStudentsTable();
            break;
        case 'teachers.html':
            renderTeachersTable();
            break;
        case 'classes.html':
            renderClassesTable();
            break;
        case 'grades.html':
            renderGradesTable();
            renderGradeCharts();
            break;
        case 'reports.html':
            renderReportsCharts();
            break;
    }
}

// ===== DASHBOARD =====
function loadDashboard() {
    renderStudentTable();
    renderAttendanceChart();
    renderCalendar();
    renderNotifications('notificationList');
    renderNotifications('notificationDropdown');
}

function renderStudentTable() {
    const tbody = document.querySelector('#studentTable tbody');
    if (!tbody) return;

    const students = [
        { id: '2023001', name: 'Ana Silva', email: 'ana.silva@email.com', grade: '9º Ano A', status: 'ativo', avatar: 'AS' },
        { id: '2023002', name: 'Bruno Costa', email: 'bruno.costa@email.com', grade: '8º Ano B', status: 'ativo', avatar: 'BC' },
        { id: '2023003', name: 'Carla Mendes', email: 'carla.mendes@email.com', grade: '9º Ano A', status: 'ausente', avatar: 'CM' },
        { id: '2023004', name: 'Daniel Souza', email: 'daniel.souza@email.com', grade: '7º Ano C', status: 'ativo', avatar: 'DS' },
        { id: '2023005', name: 'Eduarda Lima', email: 'eduarda.lima@email.com', grade: '9º Ano A', status: 'ativo', avatar: 'EL' },
        { id: '2023006', name: 'Felipe Torres', email: 'felipe.torres@email.com', grade: '8º Ano B', status: 'ativo', avatar: 'FT' },
        { id: '2023007', name: 'Gabriela Rocha', email: 'gabriela.rocha@email.com', grade: '9º Ano A', status: 'ativo', avatar: 'GR' },
        { id: '2023008', name: 'Henrique Dias', email: 'henrique.dias@email.com', grade: '7º Ano C', status: 'ausente', avatar: 'HD' },
    ];

    tbody.innerHTML = students.map(function(student) {
        return `
            <tr>
                <td><input type="checkbox" class="form-check-input row-selector" value="${student.id}"></td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="avatar-placeholder">${student.avatar}</div>
                        ${student.name}
                    </div>
                </td>
                <td>${student.id}</td>
                <td>${student.email}</td>
                <td>${student.grade}</td>
                <td><span class="badge ${student.status === 'ativo' ? 'badge-ativo' : 'badge-ausente'}">${student.status === 'ativo' ? 'Ativo' : 'Ausente hoje'}</span></td>
                <td class="text-end">
                    <a href="#" class="text-primary" onclick="editStudent('${student.id}')"><i class="bi bi-pencil"></i></a>
                    <a href="#" class="text-danger ms-2" onclick="deleteStudent('${student.id}')"><i class="bi bi-trash"></i></a>
                </td>
            </tr>
        `;
    }).join('');
}

function editStudent(id) {
    console.log('Editar estudante:', id);
}

function deleteStudent(id) {
    if (confirm('Tem certeza que deseja excluir este estudante?')) {
        console.log('Excluir estudante:', id);
    }
}

// ===== ATTENDANCE CHART (Dashboard) =====
function renderAttendanceChart() {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx || typeof Chart === 'undefined') return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
            datasets: [{
                label: 'Presença (%)',
                data: [92, 88, 95, 87, 91],
                backgroundColor: 'rgba(6, 214, 160, 0.7)',
                borderColor: 'rgba(6, 214, 160, 1)',
                borderWidth: 1,
                borderRadius: 6,
                barPercentage: 0.7
            }, {
                label: 'Ausências',
                data: [8, 12, 5, 13, 9],
                backgroundColor: 'rgba(239, 70, 111, 0.7)',
                borderColor: 'rgba(239, 70, 111, 1)',
                borderWidth: 1,
                borderRadius: 6,
                barPercentage: 0.7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: { beginAtZero: true, grid: { drawBorder: false } },
                x: { grid: { display: false } }
            }
        }
    });
}

// ===== CALENDAR =====
function renderCalendar() {
    const container = document.getElementById('calendarContainer');
    if (!container) return;

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startingDay = firstDay.getDay();

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const events = {
        5: 'Prova de Matemática',
        12: 'Reunião de Pais',
        15: 'Entrega de Trabalho',
        20: 'Evento de Formatura',
        28: 'Prova Final'
    };

    // Update month name
    const monthHeader = container.closest('.card').querySelector('.card-header h6');
    if (monthHeader) {
        monthHeader.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }

    let html = '<div class="calendar-grid">';
    html += '<div class="calendar-day-header">' + dayNames.join('</div><div class="calendar-day-header">') + '</div>';
    html += '</div>';
    html += '<div class="calendar-grid">';

    for (let i = 0; i < startingDay; i++) {
        html += '<div class="calendar-day" style="visibility: hidden;"></div>';
    }

    for (let day = 1; day <= lastDay; day++) {
        const isCurrent = day === now.getDate();
        const hasEvent = events[day];
        const eventClass = hasEvent ? 'has-events' : '';

        html += `<div class="calendar-day ${isCurrent ? 'current' : ''} ${eventClass}" style="position: relative;">
            <div class="calendar-day-number">${day}</div>
            <div class="calendar-day-name">${hasEvent || ''}</div>
        </div>`;
    }

    html += '</div>';
    container.innerHTML = html;

    // Add stagger animation
    const dayElements = container.querySelectorAll('.calendar-day:not(.current)');
    dayElements.forEach(function(day, index) {
        day.style.animationDelay = (index * 0.02) + 's';
    });
}

// ===== NOTIFICATIONS =====
function renderNotifications(elementId) {
    const container = document.getElementById(elementId || 'notificationList');
    if (!container) return;

    const notifications = [
        { id: 1, icon: 'bi bi-person-check', title: 'Nova matrícula', message: 'Aluno Carlos Eduardo entrou para o 6º ano.', time: '5 min atrás', unread: true },
        { id: 2, icon: 'bi bi-exclamation-triangle', title: 'Ausência registrada', message: '3 alunos faltaram na aula de hoje.', time: '10 min atrás', unread: true },
        { id: 3, icon: 'bi bi-clipboard-check', title: 'Notas atualizadas', message: 'Prova de Ciências foi corrigida.', time: '25 min atrás', unread: false },
        { id: 4, icon: 'bi bi-info-circle', title: 'Mensagem da diretoria', message: 'Reunião de pais será na próxima sexta.', time: '1h atrás', unread: false }
    ];

    container.innerHTML = notifications.map(function(n) {
        return `<div class="notification-item ${n.unread ? 'unread' : ''}">
            <div class="d-flex gap-3">
                <div class="notification-icon"><i class="${n.icon}"></i></div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between">
                        <strong class="mb-0">${n.title}</strong>
                        <span class="notification-time">${n.time}</span>
                    </div>
                    <p class="mb-0 mt-1 text-muted small">${n.message}</p>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ===== STUDENTS TABLE =====
function renderStudentsTable() {
    const tbody = document.querySelector('#studentsTable tbody');
    if (!tbody) return;

    const students = [
        { id: '2023001', name: 'Ana Silva', email: 'ana.silva@email.com', grade: '9º Ano A', status: 'ativo', avatar: 'AS' },
        { id: '2023002', name: 'Bruno Costa', email: 'bruno.costa@email.com', grade: '8º Ano B', status: 'ativo', avatar: 'BC' },
        { id: '2023003', name: 'Carla Mendes', email: 'carla.mendes@email.com', grade: '9º Ano A', status: 'inativo', avatar: 'CM' },
        { id: '2023004', name: 'Daniel Souza', email: 'daniel.souza@email.com', grade: '7º Ano C', status: 'ativo', avatar: 'DS' },
    ];

    tbody.innerHTML = students.map(function(student) {
        return `
            <tr>
                <td><input type="checkbox" class="form-check-input row-selector" value="${student.id}"></td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="avatar-placeholder">${student.avatar}</div>
                        ${student.name}
                    </div>
                </td>
                <td>${student.id}</td>
                <td>${student.email}</td>
                <td>${student.grade}</td>
                <td><span class="badge ${student.status === 'ativo' ? 'badge-ativo' : 'badge-inativo'}">${student.status === 'ativo' ? 'Ativo' : 'Inativo'}</span></td>
                <td class="text-end">
                    <a href="#" class="text-primary" onclick="editStudent('${student.id}')"><i class="bi bi-pencil"></i></a>
                    <a href="#" class="text-danger ms-2" onclick="deleteStudent('${student.id}')"><i class="bi bi-trash"></i></a>
                </td>
            </tr>
        `;
    }).join('');
}

// ===== TEACHERS TABLE =====
function renderTeachersTable() {
    const tbody = document.querySelector('#teachersTable tbody');
    if (!tbody) return;

    const teachers = [
        { id: 'TCH001', name: 'Prof. Carlos Mendes', subject: 'Matemática', email: 'carlos.mendes@escola.edu.br', status: 'ativo', avatar: 'CM' },
        { id: 'TCH002', name: 'Prof. Diana Costa', subject: 'Português', email: 'diana.costa@escola.edu.br', status: 'ativo', avatar: 'DC' },
        { id: 'TCH003', name: 'Prof. Eduardo Lima', subject: 'Ciências', email: 'eduardo.lima@escola.edu.br', status: 'ativo', avatar: 'EL' },
        { id: 'TCH004', name: 'Prof. Fernanda Rocha', subject: 'História', email: 'fernanda.rocha@escola.edu.br', status: 'inativo', avatar: 'FR' },
    ];

    tbody.innerHTML = teachers.map(function(t) {
        return `
            <tr>
                <td><input type="checkbox" class="form-check-input row-selector"></td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="avatar-placeholder">${t.avatar}</div>
                        ${t.name}
                    </div>
                </td>
                <td>${t.id}</td>
                <td>${t.subject}</td>
                <td>${t.email}</td>
                <td><span class="badge ${t.status === 'ativo' ? 'badge-ativo' : 'badge-inativo'}">${t.status === 'ativo' ? 'Ativo' : 'Inativo'}</span></td>
                <td class="text-end">
                    <a href="#" class="text-primary" onclick="editTeacher('${t.id}')"><i class="bi bi-pencil"></i></a>
                    <a href="#" class="text-danger ms-2"><i class="bi bi-trash"></i></a>
                </td>
            </tr>
        `;
    }).join('');
}

function editTeacher(id) {
    console.log('Editar professor:', id);
}

// ===== CLASSES TABLE =====
function renderClassesTable() {
    const tbody = document.querySelector('#classesTable tbody');
    if (!tbody) return;

    const classes = [
        { code: 'CLS001', name: '9º Ano A', teacher: 'Prof. Carlos Mendes', students: 32, room: 'Sala 101', schedule: '2ª/4ª 08:00' },
        { code: 'CLS002', name: '9º Ano B', teacher: 'Prof. Diana Costa', students: 28, room: 'Sala 102', schedule: '3ª/5ª 09:00' },
        { code: 'CLS003', name: '8º Ano A', teacher: 'Prof. Eduardo Lima', students: 35, room: 'Sala 103', schedule: '2ª/4ª 10:00' },
        { code: 'CLS004', name: '7º Ano C', teacher: 'Prof. Fernanda Rocha', students: 29, room: 'Sala 104', schedule: '3ª/5ª 08:00' },
    ];

    tbody.innerHTML = classes.map(function(c) {
        return `
            <tr>
                <td><strong>${c.code}</strong></td>
                <td>${c.name}</td>
                <td>${c.teacher}</td>
                <td>${c.students}</td>
                <td>${c.room}</td>
                <td>${c.schedule}</td>
                <td class="text-end">
                    <a href="#" class="text-primary"><i class="bi bi-pencil"></i></a>
                    <a href="#" class="text-info ms-2"><i class="bi bi-eye"></i></a>
                </td>
            </tr>
        `;
    }).join('');
}

// ===== GRADES TABLE =====
function renderGradesTable() {
    const tbody = document.querySelector('#gradesTable tbody');
    if (!tbody) return;

    const grades = [
        { student: 'Ana Silva', bim1: '9.5', bim2: '8.7', bim3: '9.2', bim4: '9.0', avg: '9.1', status: 'aprovado', avatar: 'AS' },
        { student: 'Bruno Costa', bim1: '7.0', bim2: '6.5', bim3: '7.2', bim4: '6.8', avg: '6.9', status: 'recuperacao', avatar: 'BC' },
        { student: 'Carla Mendes', bim1: '5.5', bim2: '4.8', bim3: '5.2', bim4: '4.5', avg: '5.0', status: 'reprovado', avatar: 'CM' },
        { student: 'Daniel Souza', bim1: '8.0', bim2: '7.8', bim3: '8.5', bim4: '8.2', avg: '8.1', status: 'aprovado', avatar: 'DS' },
        { student: 'Eduarda Lima', bim1: '9.0', bim2: '8.8', bim3: '9.4', bim4: '9.1', avg: '9.1', status: 'aprovado', avatar: 'EL' },
    ];

    tbody.innerHTML = grades.map(function(g) {
        const avgNum = parseFloat(g.avg);
        let bgColor = '';
        let badgeClass = 'badge-aprovado';
        let badgeText = 'Aprovado';

        if (avgNum >= 9) bgColor = 'bg-success';
        else if (avgNum >= 7) bgColor = 'bg-info';
        else if (avgNum >= 6) bgColor = 'bg-warning';
        else bgColor = 'bg-danger';

        if (g.status === 'reprovado') { badgeClass = 'badge-reprovado'; badgeText = 'Reprovado'; }
        else if (g.status === 'recuperacao') { badgeClass = 'badge-emdia'; badgeText = 'Recuperação'; }

        return `
            <tr>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="avatar-placeholder">${g.avatar}</div>
                        ${g.student}
                    </div>
                </td>
                <td class="text-center">${g.bim1}</td>
                <td class="text-center">${g.bim2}</td>
                <td class="text-center">${g.bim3}</td>
                <td class="text-center">${g.bim4}</td>
                <td class="text-center fw-bold">${g.avg}</td>
                <td class="text-center"><span class="badge ${badgeClass}">${badgeText}</span></td>
                <td>
                    <div class="grade-bar"><div class="grade-bar-fill ${bgColor}" style="width: ${avgNum * 10}%"></div></div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderGradeCharts() {
    const distCtx = document.getElementById('gradeDistributionChart');
    const evoCtx = document.getElementById('gradeEvolutionChart');

    if (distCtx && typeof Chart !== 'undefined') {
        new Chart(distCtx, {
            type: 'bar',
            data: {
                labels: ['0-2', '2-4', '4-6', '6-8', '8-10'],
                datasets: [{
                    label: 'Número de Alunos',
                    data: [2, 5, 8, 12, 7],
                    backgroundColor: 'rgba(67, 97, 238, 0.7)',
                    borderColor: 'rgba(67, 97, 238, 1)',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 1500, easing: 'easeOutQuart' },
                plugins: { legend: { display: false } },
                scales: { y: { min: 0, grid: { drawBorder: false } } }
            }
        });
    }

    if (evoCtx && typeof Chart !== 'undefined') {
        new Chart(evoCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Média da Classe',
                    data: [7.2, 7.5, 7.8, 8.0, 8.2, 8.5],
                    borderColor: 'var(--primary)',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 1500, easing: 'easeOutQuart' },
                plugins: { legend: { position: 'bottom' } },
                scales: { y: { min: 0, max: 10, grid: { drawBorder: false } } }
            }
        });
    }
}

// ===== REPORTS CHARTS =====
function renderReportsCharts() {
    const performanceCtx = document.getElementById('performanceChart');
    const attendanceCtx = document.getElementById('attendanceChartReport');

    if (performanceCtx && typeof Chart !== 'undefined') {
        new Chart(performanceCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Média Geral',
                    data: [7.2, 7.5, 7.8, 8.0, 8.2, 8.5],
                    borderColor: 'var(--primary)',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 1500, easing: 'easeOutQuart' },
                plugins: { legend: { display: false } },
                scales: { y: { min: 0, max: 10, grid: { drawBorder: false } } }
            }
        });
    }

    if (attendanceCtx && typeof Chart !== 'undefined') {
        new Chart(attendanceCtx, {
            type: 'doughnut',
            data: {
                labels: ['Presente', 'Ausente', 'Atrasado'],
                datasets: [{
                    data: [85, 10, 5],
                    backgroundColor: ['#06d6a0', '#ef476f', '#ffd800'],
                    borderWidth: 0,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 1500, easing: 'easeOutQuart' },
                plugins: { legend: { position: 'bottom' } },
                cutout: '70%'
            }
        });
    }
}

// ===== STUDENT FORM =====
function initStudentForm() {
    const form = document.getElementById('addStudentForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Estudante adicionado com sucesso!');
            this.reset();
            bootstrap.Modal.getInstance(document.getElementById('addStudentModal')).hide();
        });
    }
}

// ===== TEACHER FORM =====
function initTeacherForm() {
    const form = document.getElementById('addTeacherForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Professor adicionado com sucesso!');
            this.reset();
            bootstrap.Modal.getInstance(document.getElementById('addTeacherModal')).hide();
        });
    }
}

// ===== CLASS FORM =====
function initClassForm() {
    const form = document.getElementById('addClassForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Sala criada com sucesso!');
            this.reset();
            bootstrap.Modal.getInstance(document.getElementById('addClassModal')).hide();
        });
    }
}
