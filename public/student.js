document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user'));

  // Login check
  if (!user || user.role !== 'student') {
    window.location.href = '/index.html';
    return;
  }

  // Display username
  document.getElementById('userName').textContent = user.name;

  // Load grades
  fetch(`/api/grades/${user.id}`)
    .then(res => {
      if (!res.ok) throw new Error('Grades could not be loaded: ' + res.status);
      return res.json();
    })
    .then(grades => {
      const tbody = document.getElementById('gradesBody');
      tbody.innerHTML = grades.map(grade => `
        <tr>
          <td>${grade.course}</td>
          <td>${grade.grade}</td>
        </tr>
      `).join('');
    })
    .catch(err => {
      console.error('Error:', err);
      alert('Grades could not be loaded: ' + err.message);
    });

  document.querySelector(".logout-btn").style.display = "inline-block";
  // Log out
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = '/index.html';
  });
});