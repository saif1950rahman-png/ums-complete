-- ============================================================
-- University Management System (UMS) - Database Schema
-- Compatible with MySQL 5.7+
-- ============================================================

CREATE DATABASE IF NOT EXISTS ums_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ums_db;

-- ============================================================
-- ADMINS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,          -- bcrypt hashed
    full_name   VARCHAR(100) NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- DEPARTMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(10) NOT NULL UNIQUE,    -- e.g. CSE, EEE
    name        VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- STUDENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    student_id      VARCHAR(20) NOT NULL UNIQUE,  -- e.g. 2021-1-60-001
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(100) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,         -- bcrypt hashed
    department_id   INT NOT NULL,
    batch           VARCHAR(10) NOT NULL,          -- e.g. 2021
    semester        INT NOT NULL DEFAULT 1,        -- current semester
    phone           VARCHAR(20),
    address         TEXT,
    cgpa            DECIMAL(4,2) DEFAULT 0.00,
    status          ENUM('Active','Inactive','Graduated') DEFAULT 'Active',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
);

-- ============================================================
-- COURSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    course_code     VARCHAR(20) NOT NULL UNIQUE,   -- e.g. CSE301
    course_name     VARCHAR(150) NOT NULL,
    credit_hours    DECIMAL(3,1) NOT NULL,
    department_id   INT NOT NULL,
    semester        INT NOT NULL,
    description     TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
);

-- ============================================================
-- RESULTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS results (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    student_id      INT NOT NULL,
    course_id       INT NOT NULL,
    semester        INT NOT NULL,
    marks_obtained  DECIMAL(5,2),
    total_marks     DECIMAL(5,2) DEFAULT 100,
    grade           VARCHAR(5),                    -- A+, A, B+, B, C+, C, D, F
    grade_point     DECIMAL(3,2),
    year            YEAR NOT NULL,
    remarks         VARCHAR(100),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_result (student_id, course_id, semester, year),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id)  REFERENCES courses(id)  ON DELETE CASCADE
);

-- ============================================================
-- FEES TABLE  (CORE MODULE)
-- ============================================================
CREATE TABLE IF NOT EXISTS fees (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    student_id          INT NOT NULL,
    semester            INT NOT NULL,
    year                YEAR NOT NULL,
    total_fee           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    paid_amount         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    due_amount          DECIMAL(10,2) GENERATED ALWAYS AS (total_fee - paid_amount) STORED,
    status              ENUM('Paid','Partial','Unpaid') NOT NULL DEFAULT 'Unpaid',
    last_payment_date   DATE,
    due_date            DATE,
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_fee (student_id, semester, year),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ============================================================
-- PAYMENT HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_history (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    fee_id          INT NOT NULL,
    student_id      INT NOT NULL,
    amount_paid     DECIMAL(10,2) NOT NULL,
    payment_date    DATE NOT NULL,
    payment_method  ENUM('Cash','Bank Transfer','Mobile Banking','Online') DEFAULT 'Cash',
    transaction_id  VARCHAR(100),
    received_by     VARCHAR(100),               -- admin name
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fee_id)     REFERENCES fees(id)     ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default admin (password: admin123)
INSERT INTO admins (username, password, full_name, email) VALUES
('admin', 'admin123', 'System Administrator', 'admin@university.edu')
ON DUPLICATE KEY UPDATE username = username;

-- Departments
INSERT INTO departments (code, name) VALUES
('CSE',  'Computer Science & Engineering'),
('EEE',  'Electrical & Electronic Engineering'),
('BBA',  'Business Administration'),
('ENG',  'English'),
('LAW',  'Law')
ON DUPLICATE KEY UPDATE code = code;

-- Sample students (password: student123)
INSERT INTO students (student_id, full_name, email, password, department_id, batch, semester, phone, cgpa) VALUES
('2021-1-60-001', 'Rahman Ahmed',     'rahman@student.edu',  'student123', 1, '2021', 5, '01711000001', 3.75),
('2021-1-60-002', 'Fatema Begum',     'fatema@student.edu',  'student123', 1, '2021', 5, '01711000002', 3.50),
('2021-2-60-001', 'Karim Uddin',      'karim@student.edu',   'student123', 2, '2021', 4, '01711000003', 3.20),
('2022-1-60-001', 'Sumaiya Islam',    'sumaiya@student.edu', 'student123', 1, '2022', 3, '01711000004', 3.90),
('2022-3-60-001', 'Nafis Hossain',    'nafis@student.edu',   'student123', 3, '2022', 3, '01711000005', 3.10)
ON DUPLICATE KEY UPDATE student_id = student_id;

-- Sample courses
INSERT INTO courses (course_code, course_name, credit_hours, department_id, semester) VALUES
('CSE101', 'Introduction to Programming',          3.0, 1, 1),
('CSE201', 'Data Structures & Algorithms',         3.0, 1, 3),
('CSE301', 'Database Management Systems',          3.0, 1, 5),
('CSE302', 'Software Engineering',                 3.0, 1, 5),
('EEE101', 'Basic Electrical Engineering',         3.0, 2, 1),
('BBA101', 'Principles of Management',             3.0, 3, 1),
('ENG101', 'English Composition',                  3.0, 4, 1)
ON DUPLICATE KEY UPDATE course_code = course_code;

-- Sample fees
INSERT INTO fees (student_id, semester, year, total_fee, paid_amount, status, last_payment_date, due_date) VALUES
(1, 5, 2024, 25000.00, 25000.00, 'Paid',    '2024-01-15', '2024-01-31'),
(1, 4, 2023, 25000.00, 20000.00, 'Partial', '2023-08-10', '2023-07-31'),
(2, 5, 2024, 25000.00,  0.00,    'Unpaid',  NULL,         '2024-01-31'),
(3, 4, 2024, 22000.00, 22000.00, 'Paid',    '2024-02-01', '2024-02-28'),
(4, 3, 2024, 25000.00, 15000.00, 'Partial', '2024-03-05', '2024-03-31')
ON DUPLICATE KEY UPDATE student_id = student_id;

-- Sample results
INSERT INTO results (student_id, course_id, semester, marks_obtained, total_marks, grade, grade_point, year) VALUES
(1, 1, 1, 88, 100, 'A',  3.75, 2021),
(1, 2, 3, 75, 100, 'B+', 3.25, 2022),
(2, 1, 1, 92, 100, 'A+', 4.00, 2021),
(3, 5, 1, 70, 100, 'B',  3.00, 2021),
(4, 1, 1, 95, 100, 'A+', 4.00, 2022)
ON DUPLICATE KEY UPDATE student_id = student_id;
