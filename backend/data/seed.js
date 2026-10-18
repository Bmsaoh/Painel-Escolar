const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'school.db');
const dataDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

async function seed() {
    console.log('Iniciando seed do banco de dados...');

    db.serialize(() => {
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'admin',
                school_name TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                enrollment TEXT UNIQUE NOT NULL,
                email TEXT,
                grade TEXT,
                birth_date DATE,
                status TEXT DEFAULT 'ativo',
                avatar TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS teachers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                employee_id TEXT UNIQUE NOT NULL,
                subject TEXT,
                email TEXT,
                status TEXT DEFAULT 'ativo',
                hire_date DATE,
                avatar TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS classes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT NOT NULL,
                name TEXT NOT NULL,
                teacher_id INTEGER,
                subject TEXT,
                room TEXT,
                schedule TEXT,
                capacity INTEGER DEFAULT 35,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                class_id INTEGER,
                date DATE NOT NULL,
                status TEXT NOT NULL,
                justification TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id),
                FOREIGN KEY (class_id) REFERENCES classes(id)
            );

            CREATE TABLE IF NOT EXISTS grades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                class_id INTEGER,
                subject TEXT,
                bimester TEXT,
                grade_value REAL,
                max_value REAL DEFAULT 10,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id),
                FOREIGN KEY (class_id) REFERENCES classes(id)
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token TEXT NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        `, (err) => {
            if (err) {
                console.error('Erro ao criar tabelas:', err.message);
                db.close();
                return;
            }
            console.log('Tabelas criadas/verificadas');

            const hashedPassword = bcrypt.hashSync('admin123', 12);

            db.run(
                'INSERT OR IGNORE INTO users (name, email, password, role, school_name) VALUES (?, ?, ?, ?, ?)',
                ['Admin Sistema', 'admin@escola.edu.br', hashedPassword, 'admin', 'Colégio Estadual São José'],
                function(err) {
                    if (err) {
                        console.error('Erro ao criar usuário admin:', err.message);
                    } else {
                        console.log('Usuário admin criado (senha: admin123)');
                    }
                }
            );

            const students = [
                ['Ana Silva', '2023001', 'ana.silva@email.com', '9º Ano A', '2008-05-12', 'ativo', 'AS'],
                ['Bruno Costa', '2023002', 'bruno.costa@email.com', '8º Ano B', '2009-11-22', 'ativo', 'BC'],
                ['Carla Mendes', '2023003', 'carla.mendes@email.com', '9º Ano A', '2008-03-03', 'ativo', 'CM'],
                ['Daniel Souza', '2023004', 'daniel.souza@email.com', '7º Ano C', '2010-07-18', 'inativo', 'DS'],
                ['Eduarda Lima', '2023005', 'eduarda.lima@email.com', '9º Ano A', '2008-09-25', 'ativo', 'EL'],
                ['Felipe Torres', '2023006', 'felipe.torres@email.com', '8º Ano B', '2009-02-14', 'ativo', 'FT'],
                ['Gabriela Rocha', '2023007', 'gabriela.rocha@email.com', '9º Ano A', '2008-06-30', 'ativo', 'GR'],
                ['Henrique Dias', '2023008', 'henrique.dias@email.com', '7º Ano C', '2010-12-05', 'ativo', 'HD']
            ];

            const insertStudent = db.prepare(
                'INSERT OR IGNORE INTO students (name, enrollment, email, grade, birth_date, status, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            students.forEach(s => insertStudent.run(s));
            insertStudent.finalize();

            const teachers = [
                ['Prof. Carlos Mendes', 'TCH001', 'Matemática', 'carlos.mendes@escola.edu.br', 'ativo', '2020-01-15', 'CM'],
                ['Prof. Diana Costa', 'TCH002', 'Português', 'diana.costa@escola.edu.br', 'ativo', '2019-03-20', 'DC'],
                ['Prof. Eduardo Lima', 'TCH003', 'Ciências', 'eduardo.lima@escola.edu.br', 'ativo', '2021-08-10', 'EL'],
                ['Prof. Fernanda Rocha', 'TCH004', 'História', 'fernanda.rocha@escola.edu.br', 'inativo', '2018-11-05', 'FR']
            ];

            const insertTeacher = db.prepare(
                'INSERT OR IGNORE INTO teachers (name, employee_id, subject, email, status, hire_date, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            teachers.forEach(t => insertTeacher.run(t));
            insertTeacher.finalize();

            const classes = [
                ['CLS001', '9º Ano A', 1, 'Matemática', 'Sala 101', '2ª/4ª 08:00', 32],
                ['CLS002', '9º Ano B', 2, 'Português', 'Sala 102', '3ª/5ª 09:00', 28],
                ['CLS003', '8º Ano A', 3, 'Ciências', 'Sala 103', '2ª/4ª 10:00', 35],
                ['CLS004', '7º Ano C', 4, 'História', 'Sala 104', '3ª/5ª 08:00', 29]
            ];

            const insertClass = db.prepare(
                'INSERT OR IGNORE INTO classes (code, name, teacher_id, subject, room, schedule, capacity) VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            classes.forEach(c => insertClass.run(c));
            insertClass.finalize();

            setTimeout(() => {
                const today = new Date().toISOString().split('T')[0];
                const attendances = [
                    [1, 1, today, 'presente', null],
                    [2, 1, today, 'presente', null],
                    [3, 1, today, 'ausente', 'Consulta médica'],
                    [4, 1, today, 'presente', null],
                    [5, 1, today, 'presente', null],
                ];

                const insertAttendance = db.prepare(
                    'INSERT INTO attendance (student_id, class_id, date, status, justification) VALUES (?, ?, ?, ?, ?)'
                );
                attendances.forEach(a => insertAttendance.run(a));
                insertAttendance.finalize();

                const grades = [
                    [1, 1, 'Matemática', '1º Bimestre', 9.5, 10],
                    [1, 1, 'Matemática', '2º Bimestre', 9.0, 10],
                    [2, 1, 'Matemática', '1º Bimestre', 7.0, 10],
                    [2, 1, 'Matemática', '2º Bimestre', 6.5, 10],
                    [3, 1, 'Matemática', '1º Bimestre', 5.5, 10],
                    [3, 1, 'Matemática', '2º Bimestre', 4.8, 10],
                ];

                const insertGrade = db.prepare(
                    'INSERT OR IGNORE INTO grades (student_id, class_id, subject, bimester, grade_value, max_value) VALUES (?, ?, ?, ?, ?, ?)'
                );
                grades.forEach(g => insertGrade.run(g));
                insertGrade.finalize();

                console.log('\nDados de seed inseridos com sucesso!');
                console.log('\nCredenciais de login:');
                console.log('  Email: admin@escola.edu.br');
                console.log('  Senha: admin123');
                console.log(`\nAPI rodando em http://localhost:${process.env.PORT || 3000}/api`);
                console.log(`Frontend: http://localhost:${process.env.PORT || 3000}`);

                db.close((err) => {
                    if (err) console.error('Erro ao fechar DB:', err.message);
                });
            }, 500);
        });
    });
}

seed();
