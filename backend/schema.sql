

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'MENTOR', 'ADMIN')),
    department VARCHAR(100),
    phone VARCHAR(20),
    roll_number VARCHAR(50),                
    mentor_id INT REFERENCES users(id) ON DELETE SET NULL, 
    mentor_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grievances (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'Other',       
    status VARCHAR(30) DEFAULT 'Pending',  
    student_id INT REFERENCES users(id) ON DELETE CASCADE,
    student_name VARCHAR(100),
    mentor_id INT REFERENCES users(id) ON DELETE SET NULL,                        
    remarks TEXT,                            
    created_at VARCHAR(50)                   
);

CREATE TABLE IF NOT EXISTS meetings (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES users(id) ON DELETE CASCADE,
    student_name VARCHAR(100),
    mentor_id INT REFERENCES users(id) ON DELETE CASCADE,
    mentor_name VARCHAR(100),
    title VARCHAR(200) NOT NULL,
    purpose TEXT,
    meeting_time VARCHAR(50),
    status VARCHAR(30) DEFAULT 'Requested',  
    venue_or_link VARCHAR(200),              
    feedback TEXT,                           
    created_at VARCHAR(50)
);

INSERT INTO users (name, email, password, role, department, phone) 
VALUES ('System Admin', 'admin@college.edu', 'admin123', 'ADMIN', 'Management', '9876543210')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, email, password, role, department, phone) 
VALUES ('Himanshu', 'mentor@college.edu', 'mentor123', 'MENTOR', 'Computer Application', '9876543211')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, email, password, role, department, phone, roll_number, mentor_id, mentor_name) 
VALUES ('Khushbu', 'student@college.edu', 'student123', 'STUDENT', 'BCA', '9876543212', '24042824', 2, 'Himanshu')
ON CONFLICT (email) DO NOTHING;

INSERT INTO grievances (title, description, category, status, student_id, student_name, mentor_id, created_at)
VALUES (
    'Wi-Fi not working in Computer Lab 3',
    'Internet disconnects continuously during practical lab classes, affecting our coursework.',
    'Infrastructure',
    'Pending',
    3,
    'Khushbu',
    2,
    TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI')
);

INSERT INTO meetings (student_id, student_name, mentor_id, mentor_name, title, purpose, meeting_time, status, venue_or_link, created_at)
VALUES (
    3,
    'Khushbu',
    2,
    'Himanshu',
    'Semester Project Guidance',
    'Discussion regarding database schema and project architecture.',
    '2026-10-25 14:00',
    'Approved',
    'Faculty Cabin 204, IT Block',
    TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI')
);
