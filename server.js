const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

let data;

try {
  data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
} catch (err) {
  console.error('Error reading data.json:', err);
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// Serve home.html for root URL
app.get('/', (req, res) => {
  console.log('Serving home.html for root URL:', path.join(__dirname, 'public', 'home.html'));
  res.sendFile(path.join(__dirname, 'public', 'home.html'), (err) => {
    if (err) {
      console.error('Failed to send home.html:', err);
      res.status(500).send('Server error: Home page could not be loaded.');
    }
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Contact form endpoint
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are required.' });
  }
  let contacts = [];
  try {
    if (fs.existsSync('contacts.json')) {
      contacts = JSON.parse(fs.readFileSync('contacts.json', 'utf8'));
    }
  } catch (err) {
    console.error('Error reading contacts.json:', err);
  }
  contacts.push({
    name,
    email,
    message,
    timestamp: new Date().toISOString()
  });
  try {
    fs.writeFileSync('contacts.json', JSON.stringify(contacts, null, 2), 'utf8');
    console.log('Contact message saved to contacts.json:', { name, email, message });
    res.json({ message: 'Your message has been received.' });
  } catch (err) {
    console.error('Failed to save message to contacts.json:', err);
    res.status(500).json({ message: 'Message could not be saved: Server error.' });
  }
});

// Read contact messages
app.get('/api/contacts', (req, res) => {
  try {
    if (fs.existsSync('contacts.json')) {
      const contacts = JSON.parse(fs.readFileSync('contacts.json', 'utf8'));
      res.json(contacts);
    } else {
      res.json([]);
    }
  } catch (err) {
    console.error('Error reading contacts.json:', err);
    res.status(500).json({ message: 'Messages could not be read: Server error.' });
  }
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }
  const user = data.users.find(
    (u) => u.username === username && u.password === password
  );
  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }
  res.json({
    ...user,
    redirect: user.role === 'student' ? '/student-panel.html' :
              user.role === 'teacher' ? '/teacher-panel.html' :
              user.role === 'admin' ? '/admin-panel.html' : '/index.html'
  });
});

// Users - GET
app.get('/api/users', (req, res) => {
  const filteredUsers = data.users.map(user => {
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    if (user.role === 'student') {
      const studentCourses = data.grades
        .filter(grade => grade.studentId === user.id)
        .map(grade => grade.course);
      userWithoutPassword.courses = user.courses || studentCourses;
    }
    return userWithoutPassword;
  });
  res.json(filteredUsers);
});

// Users - POST (Add new user)
app.post('/api/users', (req, res) => {
  const { name, username, password, role, courses } = req.body;
  if (!name || !username || !password || !role) {
    return res.status(400).json({ message: 'Name, username, password, and role are required.' });
  }
  if (!['student', 'teacher', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role.' });
  }
  if (data.users.some(u => u.username === username)) {
    return res.status(400).json({ message: 'Username already exists.' });
  }
  const newUser = {
    id: data.users.length ? Math.max(...data.users.map(u => u.id)) + 1 : 1,
    name,
    username,
    password, // Note: In a real application, password should be hashed
    role,
    courses: role === 'student' || role === 'teacher' ? courses || [] : []
  };
  data.users.push(newUser);
  try {
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2), 'utf8');
    console.log('New user added:', { id: newUser.id, username, role });
    res.status(201).json({ message: `${role === 'student' ? 'Student' : role === 'teacher' ? 'Teacher' : 'Admin'} added.` });
  } catch (err) {
    console.error('Error writing to data.json:', err);
    res.status(500).json({ message: 'User could not be added: Server error.' });
  }
});

// Add Course
app.post('/api/courses', (req, res) => {
  const { course, credit } = req.body;
  if (!course || !credit) {
    return res.status(400).json({ message: 'Course name and credit are required.' });
  }
  if (data.courses.some(c => c.course === course)) {
    return res.status(400).json({ message: 'Course already exists.' });
  }
  data.courses.push({ course, credit });
  try {
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2), 'utf8');
    res.json({ message: 'Course added', course });
  } catch (err) {
    console.error('Error writing to data.json:', err);
    res.status(500).json({ message: 'Course could not be added: Server error.' });
  }
});

// Student Grades
app.get('/api/grades/:studentId', (req, res) => {
  const studentId = parseInt(req.params.studentId, 10);
  if (isNaN(studentId)) {
    return res.status(400).json({ message: 'Invalid student ID.' });
  }
  const grades = data.grades.filter(g => g.studentId === studentId);
  res.json(grades);
});

// All Grades
app.get('/api/grades', (req, res) => {
  const user = JSON.parse(req.query.user || '{}');
  if (user.role === 'teacher' && user.courses) {
    const grades = data.grades.filter(g => user.courses.includes(g.course));
    res.json(grades);
  } else {
    res.json(data.grades);
  }
});

// Update Grade
app.put('/api/grades/:index', (req, res) => {
  const index = parseInt(req.params.index, 10);
  const { grade } = req.body;
  const user = JSON.parse(req.query.user || '{}');
  if (isNaN(index) || index < 0 || index >= data.grades.length) {
    return res.status(400).json({ message: 'Invalid grade index.' });
  }
  if (isNaN(grade) || grade < 0 || grade > 100) {
    return res.status(400).json({ message: 'Grade must be between 0 and 100.' });
  }
  if (user.role === 'teacher' && user.courses && !user.courses.includes(data.grades[index].course)) {
    console.log(`Permission error: index=${index}, course=${data.grades[index].course}, user.courses=${user.courses}`);
    return res.status(403).json({ message: 'You do not have permission to edit this course.' });
  }
  data.grades[index].grade = grade;
  try {
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2), 'utf8');
    res.json({ message: 'Grade updated successfully.', grade: data.grades[index] });
  } catch (err) {
    res.status(500).json({ message: 'Grade could not be updated: File write error.' });
  }
});

// Delete Grade
app.delete('/api/grades/:index', (req, res) => {
  const index = parseInt(req.params.index, 10);
  const user = JSON.parse(req.query.user || '{}');
  if (isNaN(index) || index < 0 || index >= data.grades.length) {
    return res.status(400).json({ message: 'Invalid grade index.' });
  }
  if (user.role === 'teacher' && user.courses && !user.courses.includes(data.grades[index].course)) {
    return res.status(403).json({ message: 'You do not have permission to delete this course.' });
  }
  const deletedGrade = data.grades.splice(index, 1)[0];
  try {
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2), 'utf8');
    res.json({ message: 'Grade deleted successfully.', grade: deletedGrade });
  } catch (err) {
    res.status(500).json({ message: 'Grade could not be deleted: File write error.' });
  }
});

app.delete('/api/contacts/:index', (req, res) => {
  try {
    let contacts = [];
    if (fs.existsSync('contacts.json')) {
      contacts = JSON.parse(fs.readFileSync('contacts.json', 'utf8'));
    }
    const index = parseInt(req.params.index, 10);
    if (isNaN(index) || index < 0 || index >= contacts.length) {
      return res.status(400).json({ message: 'Invalid message index.' });
    }
    contacts.splice(index, 1);
    fs.writeFileSync('contacts.json', JSON.stringify(contacts, null, 2));
    res.json({ message: 'Message deleted.' });
  } catch (err) {
    console.error('Error writing to contacts.json:', err);
    res.status(500).json({ message: 'The message cannot be deleted due to server errors.' });
  }
});

// Courses
app.get('/api/courses', (req, res) => {
  res.json(data.courses);
});

app.listen(PORT, () => {
  console.log(`Server is running: http://localhost:${PORT}`);
});