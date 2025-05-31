document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || user.role !== 'admin') {
    window.location.href = '/index.html';
    return;
  }

  // Sections and active section tracking
  const sections = {
    messages: document.getElementById('messagesSection'),
    addStudent: document.getElementById('addStudentSection'),
    addTeacher: document.getElementById('addTeacherSection'),
    addCourse: document.getElementById('addCourseSection'),
    listUsers: document.getElementById('listUsersSection')
  };
  let activeSection = null;

  function toggleSection(sectionId) {
    if (activeSection === sectionId) {
      sections[sectionId].classList.add('hidden');
      activeSection = null;
    } else {
      Object.values(sections).forEach(section => {
        section.classList.add('hidden');
      });
      sections[sectionId].classList.remove('hidden');
      activeSection = sectionId;
    }
  }

  document.getElementById('btnShowMessages').addEventListener('click', () => {
    toggleSection('messages');
  });
  document.getElementById('btnAddStudent').addEventListener('click', () => {
    toggleSection('addStudent');
  });
  document.getElementById('btnAddTeacher').addEventListener('click', () => {
    toggleSection('addTeacher');
  });
  document.getElementById('btnAddCourse').addEventListener('click', () => {
    toggleSection('addCourse');
  });
  document.getElementById('btnListUsers').addEventListener('click', () => {
    toggleSection('listUsers');
    populateUsers('student'); // Default to students tab
  });

  // Fetch courses and populate <select> menus
  async function populateCourses() {
    try {
      const res = await fetch('/api/courses');
      if (!res.ok) throw new Error('Courses could not be loaded.');
      const courses = await res.json();
      const studentSelect = document.getElementById('studentCourses');
      const teacherSelect = document.getElementById('teacherCourses');
      [studentSelect, teacherSelect].forEach(select => {
        select.innerHTML = '';
        courses.forEach(course => {
          const option = document.createElement('option');
          option.value = course.course;
          option.textContent = course.course;
          select.appendChild(option);
        });
      });
      // Populate course filter buttons
      populateCourseFilters(courses);
    } catch (err) {
      console.error('Error loading courses:', err);
      document.getElementById('studentError').textContent = 'Courses could not be loaded.';
      document.getElementById('teacherError').textContent = 'Courses could not be loaded.';
    }
  }

  // Create course filter buttons
  function populateCourseFilters(courses) {
    const courseFilters = document.getElementById('courseFilters');
    courseFilters.innerHTML = '<button class="course-filter-btn active" data-course="all">All</button>';
    courses.forEach(course => {
      const button = document.createElement('button');
      button.className = 'course-filter-btn';
      button.dataset.course = course.course;
      button.textContent = course.course;
      courseFilters.appendChild(button);
    });
    // Add event listeners to buttons
    document.querySelectorAll('.course-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.course-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const role = document.querySelector('.tab-btn.active').id.replace('tab', '').toLowerCase().slice(0, -1);
        populateUsers(role, btn.dataset.course);
      });
    });
  }

  // Fetch users and populate table
  async function populateUsers(role, selectedCourse = 'all', searchQuery = '') {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Users could not be loaded.');
      let users = await res.json();
      // Role filter
      users = users.filter(u => u.role === role);
      // Course filter
      if (selectedCourse !== 'all') {
        users = users.filter(u => u.courses && u.courses.includes(selectedCourse));
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        users = users.filter(u =>
          u.id.toString().includes(query) ||
          u.name.toLowerCase().includes(query) ||
          u.username.toLowerCase().includes(query)
        );
      }
      const tbody = document.getElementById('usersBody');
      tbody.innerHTML = users.length ? users.map(user => `
        <tr>
          <td>${user.id}</td>
          <td>${user.name}</td>
          <td>${user.username}</td>
          <td>${user.role}</td>
          <td>${user.courses ? user.courses.join(', ') : '-'}</td>
        </tr>
      `).join('') : '<tr><td colspan="5">No users found.</td></tr>';
      // Update tab button active state
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.id === `tab${role.charAt(0).toUpperCase() + role.slice(1)}s`) {
          btn.classList.add('active');
        }
      });
    } catch (err) {
      console.error('Error loading users:', err);
      document.getElementById('usersBody').innerHTML = '<tr><td colspan="5">Users could not be loaded.</td></tr>';
    }
  }

  // Search functionality
  document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchQuery = e.target.value.trim();
    const role = document.querySelector('.tab-btn.active').id.replace('tab', '').toLowerCase().slice(0, -1);
    const selectedCourse = document.querySelector('.course-filter-btn.active').dataset.course;
    populateUsers(role, selectedCourse, searchQuery);
  });

  // Load messages
  document.getElementById('showMessages').addEventListener('click', async () => {
    try {
      const res = await fetch('/api/contacts');
      if (!res.ok) throw new Error('Messages could not be loaded.');
      const messages = await res.json();
      const tbody = document.getElementById('messagesBody');
      tbody.innerHTML = messages.map((m, index) => `
        <tr>
          <td>${m.name}</td>
          <td>${m.email}</td>
          <td>${m.message}</td>
          <td><button class="btn-delete" data-index="${index}">Delete</button></td>
        </tr>
      `).join('');
      document.getElementById('messagesTable').classList.remove('hidden');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });

  document.getElementById('messagesTable').addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-delete')) {
      const index = e.target.dataset.index;
      try {
        const res = await fetch(`/api/contacts/${index}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Message could not be deleted.');
        alert(result.message);
        document.getElementById('showMessages').click(); // Refresh table
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }
  });

  // Add student
  document.getElementById('addStudentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const studentCourses = Array.from(document.getElementById('studentCourses').selectedOptions).map(option => option.value);
    const data = {
      name: document.getElementById('studentName').value.trim(),
      username: document.getElementById('studentUsername').value.trim(),
      password: document.getElementById('studentPassword').value.trim(),
      role: 'student',
      courses: studentCourses
    };
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (res.status === 404) {
          throw new Error('User could not be added: Server route not found.');
        }
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('user');
          window.location.href = '/index.html';
          throw new Error('Your session has expired, please log in again.');
        }
        throw new Error('Invalid response received from server.');
      }
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Student could not be added.');
      document.getElementById('studentError').textContent = result.message;
      document.getElementById('addStudentForm').reset();
      setTimeout(() => document.getElementById('studentError').textContent = '', 3000);
    } catch (err) {
      console.error('Student addition error:', err);
      document.getElementById('studentError').textContent = err.message;
    }
  });

  // Add teacher
  document.getElementById('addTeacherForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const teacherCourses = Array.from(document.getElementById('teacherCourses').selectedOptions).map(option => option.value);
    const data = {
      name: document.getElementById('teacherName').value.trim(),
      username: document.getElementById('teacherUsername').value.trim(),
      password: document.getElementById('teacherPassword').value.trim(),
      role: 'teacher',
      courses: teacherCourses
    };
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (res.status === 404) {
          throw new Error('User could not be added: Server route not found.');
        }
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('user');
          window.location.href = '/index.html';
          throw new Error('Your session has expired, please log in again.');
        }
        throw new Error('Invalid response received from server.');
      }
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Teacher could not be added.');
      document.getElementById('teacherError').textContent = result.message;
      document.getElementById('addTeacherForm').reset();
      setTimeout(() => document.getElementById('teacherError').textContent = '', 3000);
    } catch (err) {
      console.error('Teacher addition error:', err);
      document.getElementById('teacherError').textContent = err.message;
    }
  });

  // Add course
  document.getElementById('addCourseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      course: document.getElementById('courseName').value.trim(),
      credit: parseInt(document.getElementById('courseCredit').value)
    };
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Course could not be added.');
      document.getElementById('courseError').textContent = result.message;
      document.getElementById('addCourseForm').reset();
      setTimeout(() => document.getElementById('courseError').textContent = '', 3000);
      // Update select menus and filter buttons when a new course is added
      populateCourses();
    } catch (err) {
      document.getElementById('courseError').textContent = err.message;
    }
  });

  // Tab switching
  document.getElementById('tabStudents').addEventListener('click', () => {
    const selectedCourse = document.querySelector('.course-filter-btn.active').dataset.course;
    populateUsers('student', selectedCourse);
  });
  document.getElementById('tabTeachers').addEventListener('click', () => {
    const selectedCourse = document.querySelector('.course-filter-btn.active').dataset.course;
    populateUsers('teacher', selectedCourse);
  });
  document.getElementById('tabAdmins').addEventListener('click', () => {
    const selectedCourse = document.querySelector('.course-filter-btn.active').dataset.course;
    populateUsers('admin', selectedCourse);
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = '/index.html';
  });

  // Populate courses when page loads
  populateCourses();
});