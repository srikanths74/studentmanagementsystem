-- =============================================
-- Student Management System - MySQL Schema
-- Run this file in MySQL Workbench
-- =============================================

-- Create Database
CREATE DATABASE IF NOT EXISTS studentdb;
USE studentdb;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS admin;

-- Admin Table
CREATE TABLE admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  full_name VARCHAR(100) DEFAULT 'Administrator',
  email VARCHAR(100) DEFAULT 'admin@sms.com',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students Table
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(15),
  course VARCHAR(100),
  gender ENUM('Male', 'Female', 'Other') DEFAULT 'Male',
  dob DATE,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed Admin User (username: admin, password: admin123)
INSERT INTO admin (username, password, full_name, email) 
VALUES ('admin', 'admin123', 'System Administrator', 'admin@sms.com');

-- Seed Sample Students
INSERT INTO students (name, email, phone, course, gender, dob, address) VALUES
('Aarav Sharma', 'aarav.sharma@email.com', '9876543210', 'Computer Science', 'Male', '2002-05-15', 'Mumbai, Maharashtra'),
('Priya Patel', 'priya.patel@email.com', '9876543211', 'Information Technology', 'Female', '2003-08-22', 'Ahmedabad, Gujarat'),
('Rohan Verma', 'rohan.verma@email.com', '9876543212', 'Electronics Engineering', 'Male', '2002-11-10', 'Delhi, India'),
('Sneha Reddy', 'sneha.reddy@email.com', '9876543213', 'Data Science', 'Female', '2003-03-05', 'Hyderabad, Telangana'),
('Karan Singh', 'karan.singh@email.com', '9876543214', 'Mechanical Engineering', 'Male', '2001-07-18', 'Jaipur, Rajasthan');

-- Verify setup
SELECT 'Database setup complete!' AS Status;
SELECT * FROM admin;
SELECT * FROM students;
