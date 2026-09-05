-- Create the database if it doesn't exist
-- PostgreSQL databases are selected when opening the connection; there is no USE statement.

-- Create the status type used by students
DO $$
BEGIN
    CREATE TYPE student_status AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create admin accounts for session-based authentication
CREATE TABLE IF NOT EXISTS admin_users (
    admin_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    reset_token_hash CHAR(64) UNIQUE,
    reset_token_expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Apply these fields manually when upgrading an existing database:
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS reset_token_hash CHAR(64);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP NULL;
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_key ON admin_users(email);
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_reset_token_hash_key ON admin_users(reset_token_hash);

-- Create colleges and courses for managed student classifications
CREATE TABLE IF NOT EXISTS colleges (
    college_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS courses (
    course_id SERIAL PRIMARY KEY,
    college_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    UNIQUE (college_id, name),
    FOREIGN KEY (college_id) REFERENCES colleges(college_id) ON DELETE RESTRICT
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    student_id SERIAL PRIMARY KEY,
    rfid_number VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    course VARCHAR(50),
    year_level VARCHAR(50),
    section VARCHAR(50),
    status student_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create check_ins table
CREATE TABLE IF NOT EXISTS check_ins (
    check_in_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    check_in_time TIME NOT NULL,
    check_in_date DATE NOT NULL,
    device_id VARCHAR(255),
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- Trigger function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS students_updated_at_trigger ON students;

CREATE TRIGGER students_updated_at_trigger
BEFORE UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION update_students_updated_at();

-- Create view for leaderboard
CREATE OR REPLACE VIEW leaderboard AS
SELECT s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS full_name,
    s.course,
    s.year_level,
    s.section,
    COUNT(c.check_in_id) AS visit_count
FROM students s
    LEFT JOIN check_ins c ON s.student_id = c.student_id
WHERE s.status = 'active'
GROUP BY s.student_id
ORDER BY visit_count DESC;


