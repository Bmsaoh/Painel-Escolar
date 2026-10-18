require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDB } = require('./config/database');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API do Sistema de Gestão Escolar',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            students: '/api/students',
            teachers: '/api/teachers',
            classes: '/api/classes',
            attendance: '/api/attendance',
            grades: '/api/grades'
        }
    });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/grades', require('./routes/grades'));

app.use('/api', require('./routes/auth'));

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

const staticDir = path.join(__dirname, '..');
app.use(express.static(staticDir));

app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'Endpoint não encontrado'
        });
    }
    res.sendFile(path.join(staticDir, 'index.html'));
});

app.use((err, req, res, next) => {
    console.error('Erro:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Erro interno no servidor'
    });
});

async function startServer() {
    try {
        await initializeDB();
        console.log('Banco de dados inicializado com sucesso');

        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
            console.log(`API: http://localhost:${PORT}/api`);
            console.log(`Health: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('Erro ao iniciar o servidor:', error);
        process.exit(1);
    }
}

startServer();
