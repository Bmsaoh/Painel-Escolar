class ApiService {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('auth_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new ApiError(data.message || 'Erro na requisição', response.status, data);
            }

            return data;
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(error.message || 'Erro de rede', 0);
        }
    }

    // Auth
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        this.setToken(data.data.token);
        return data;
    }

    async register(userData) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        this.setToken(data.data.token);
        return data;
    }

    async getMe() {
        return await this.request('/auth/me');
    }

    async logout() {
        await this.request('/auth/logout', { method: 'POST' });
        this.setToken(null);
    }

    // Students
    async getStudents(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/students${query ? `?${query}` : ''}`);
    }

    async getStudent(id) {
        return await this.request(`/students/${id}`);
    }

    async createStudent(data) {
        return await this.request('/students', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateStudent(id, data) {
        return await this.request(`/students/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteStudent(id) {
        return await this.request(`/students/${id}`, { method: 'DELETE' });
    }

    // Teachers
    async getTeachers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/teachers${query ? `?${query}` : ''}`);
    }

    async getTeacher(id) {
        return await this.request(`/teachers/${id}`);
    }

    async createTeacher(data) {
        return await this.request('/teachers', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateTeacher(id, data) {
        return await this.request(`/teachers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteTeacher(id) {
        return await this.request(`/teachers/${id}`, { method: 'DELETE' });
    }

    // Classes
    async getClasses(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/classes${query ? `?${query}` : ''}`);
    }

    async getClass(id) {
        return await this.request(`/classes/${id}`);
    }

    async createClass(data) {
        return await this.request('/classes', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateClass(id, data) {
        return await this.request(`/classes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteClass(id) {
        return await this.request(`/classes/${id}`, { method: 'DELETE' });
    }

    // Attendance
    async getAttendance(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/attendance${query ? `?${query}` : ''}`);
    }

    async recordAttendance(data) {
        return await this.request('/attendance', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getAttendanceStats(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/attendance/stats/summary${query ? `?${query}` : ''}`);
    }

    // Grades
    async getGrades(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/grades${query ? `?${query}` : ''}`);
    }

    async getClassGrades(classId, bimester) {
        const params = bimester ? { bimester } : {};
        const query = new URLSearchParams(params).toString();
        return await this.request(`/grades/class/${classId}${query ? `?${query}` : ''}`);
    }

    async createGrade(data) {
        return await this.request('/grades', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateGrade(id, data) {
        return await this.request(`/grades/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async getGradeReport(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/grades/report${query ? `?${query}` : ''}`);
    }
}

class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

const api = new ApiService();
window.api = api;
