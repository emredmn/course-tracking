# Course Tracking System - Project Overview

## Project Description
- A web-based course and grade tracking system.
- An application where students can view their courses and grades, teachers can manage grades, and admins can manage users and courses.

## Technologies Used
- **Backend:** Node.js, Express.js
- **Frontend:** HTML, CSS, JavaScript
- **Data Storage:** JSON files (`data.json`, `contacts.json`)
- **Other:** CORS, file system (`fs`) module

## Functional Requirements
- User login with role-based redirection (student, teacher, admin)
- Students can view their grades
- Teachers can add, update, and delete student grades
- Admin panel for user and course management
- Contact form for sending and viewing messages

## Technical Features
- REST API architecture for backend services
- Data management and storage using JSON files
- Dynamic content loading and form validation on the frontend
- Basic responsive design with CSS

## Data Structure
- `users`: User information (id, username, password, role, name, courses)
- `grades`: Student grades (student ID, course, grade)
- `courses`: Course information (course name, credit)
- `contacts`: Contact messages (name, email, message, timestamp)

## Project Layers
- **View Layer:** HTML pages (login, student panel, teacher panel, admin panel)
- **Functional Layer:** JavaScript files (`login.js`, `student.js`, `teacher.js`, `admin.js`)
- **Data Layer:** JSON files and Express.js backend API

## Current Status & Suggestions
- The project provides basic functionality.
- Passwords are stored in plain text; security can be improved.
- Using a relational or NoSQL database is recommended instead of JSON files.
- More comprehensive error handling and user feedback can be added.
- Project documentation and test coverage can be expanded.

## Potential Users
- Students
- Teachers
- System administrators (admins)

## Project Goals
- Simplify course and grade tracking
- Facilitate communication between students and teachers
- Centralize user and course management