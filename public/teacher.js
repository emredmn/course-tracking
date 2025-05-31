document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user'));

  // Login check
  if (!user || user.role !== 'teacher') {
    window.location.href = '/index.html';
    return;
  }

  // Display username
  document.getElementById('userName').textContent = user.name;

  async function refreshTable() {
    try {
      // Fetch users
      const usersRes = await fetch('/api/users');
      if (!usersRes.ok) throw new Error('Users could not be loaded.');
      const users = await usersRes.json();

      // Fetch grades (filtered by teacher's courses)
      const gradesRes = await fetch(`/api/grades?user=${encodeURIComponent(JSON.stringify(user))}`);
      if (!gradesRes.ok) throw new Error('Grades could not be loaded: ' + gradesRes.statusText);
      const grades = await gradesRes.json();

      // Fetch all grades (for index matching)
      const allGradesRes = await fetch('/api/grades');
      if (!allGradesRes.ok) throw new Error('All grades could not be loaded.');
      const allGrades = await allGradesRes.json();

      const tbody = document.querySelector('#gradesTable tbody');
      if (grades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No grades yet.</td></tr>';
        return;
      }

      tbody.innerHTML = grades.map((grade, index) => {
        const student = users.find(u => u.id === grade.studentId);
        const studentName = student ? student.name : 'Unknown Student';

        // Find index in original grades array
        const originalIndex = allGrades.findIndex(
          g => g.studentId === grade.studentId && g.course === grade.course && g.grade === grade.grade
        );

        if (originalIndex === -1) {
          console.error(`Index not found: studentId=${grade.studentId}, course=${grade.course}`);
          return '';
        }

        return `
          <tr>
            <td>${grade.studentId}</td>
            <td>${studentName}</td>
            <td>${grade.course}</td>
            <td>
              <input type="number" min="0" max="100" value="${grade.grade}" id="g${originalIndex}" class="grade-input" />
            </td>
            <td>
              <button class="btn-save" data-index="${originalIndex}">Save</button>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      document.getElementById('saveError').textContent = err.message;
      console.error('Error:', err);
    }
  }

  async function updateGrade(index) {
    const value = parseInt(document.getElementById(`g${index}`).value);
    if (isNaN(value) || value < 0 || value > 100) {
      document.getElementById('saveError').textContent = 'Grade must be between 0 and 100!';
      return;
    }
    try {
      const res = await fetch(`/api/grades/${index}?user=${encodeURIComponent(JSON.stringify(user))}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: value })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || `Grade could not be updated (Error code: ${res.status})`);
      document.getElementById('saveError').textContent = result.message;
      setTimeout(() => document.getElementById('saveError').textContent = '', 3000);
      refreshTable();
    } catch (err) {
      document.getElementById('saveError').textContent = err.message;
      console.error('Update error:', err);
    }
  }

  // Search
  document.getElementById('search').addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#gradesTable tr');
    rows.forEach(row => {
      const studentId = row.cells[0]?.textContent.toLowerCase() || '';
      const studentName = row.cells[1]?.textContent.toLowerCase() || '';
      const course = row.cells[2]?.textContent.toLowerCase() || '';
      row.style.display = (studentId.includes(search) || studentName.includes(search) || course.includes(search)) ? '' : 'none';
    });
  });

  // Button events
  document.getElementById('gradesTable').addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-save')) {
      updateGrade(e.target.dataset.index);
    }
  });

  if (user) {
    document.getElementById("logoutBtn").style.display = "inline-block";
  }
  // Log out
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = '/index.html';
  });

  refreshTable();
});