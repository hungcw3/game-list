const authPage = document.getElementById('auth-page');
const mainPage = document.getElementById('main-page');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authError = document.getElementById('auth-error');
const form = document.getElementById('game-form');
const input = document.getElementById('game-name');
const list = document.getElementById('game-list');

// Kiểm tra đã đăng nhập chưa
function getToken() {
  return localStorage.getItem('token');
}

function showMainPage() {
  authPage.style.display = 'none';
  mainPage.style.display = 'block';
  loadGames();
}

function showAuthPage() {
  authPage.style.display = 'block';
  mainPage.style.display = 'none';
}

// Khi mở trang — kiểm tra token
if (getToken()) {
  showMainPage();
} else {
  showAuthPage();
}

// Đăng ký
document.getElementById('register-btn').addEventListener('click', async function() {
  const email = authEmail.value.trim();
  const password = authPassword.value.trim();
  if (!email || !password) return;

  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (data.success) {
    authError.style.color = 'lightgreen';
    authError.textContent = 'Đăng ký thành công! Hãy đăng nhập.';
  } else {
    authError.style.color = '#e94560';
    authError.textContent = data.error;
  }
});

// Đăng nhập
document.getElementById('login-btn').addEventListener('click', async function() {
  const email = authEmail.value.trim();
  const password = authPassword.value.trim();
  if (!email || !password) return;

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    showMainPage();
  } else {
    authError.style.color = '#e94560';
    authError.textContent = data.error;
  }
});

// Đăng xuất
document.getElementById('logout-btn').addEventListener('click', function() {
  localStorage.removeItem('token');
  showAuthPage();
});

// Lấy danh sách game
async function loadGames() {
  const res = await fetch('/api/games', {
    headers: { 'authorization': getToken() }
  });
  const games = await res.json();
  list.innerHTML = '';
  games.forEach(function(game) {
    renderGame(game);
  });
}

// Hiển thị 1 game
function renderGame(game) {
  const li = document.createElement('li');

  const nameSpan = document.createElement('span');
  nameSpan.textContent = game.name;

  const statusSelect = document.createElement('select');
  statusSelect.innerHTML = `
    <option value="muon-choi">Muốn chơi</option>
    <option value="dang-choi">Đang chơi</option>
    <option value="da-xong">Đã xong</option>
  `;
  statusSelect.value = game.status;

  statusSelect.addEventListener('change', async function() {
    await fetch('/api/games/' + game.id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'authorization': getToken()
      },
      body: JSON.stringify({ status: statusSelect.value })
    });
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Xóa';
  deleteBtn.addEventListener('click', async function() {
    await fetch('/api/games/' + game.id, {
      method: 'DELETE',
      headers: { 'authorization': getToken() }
    });
    list.removeChild(li);
  });

  li.appendChild(nameSpan);
  li.appendChild(statusSelect);
  li.appendChild(deleteBtn);
  list.appendChild(li);
}

// Thêm game mới
form.addEventListener('submit', async function(e) {
  e.preventDefault();

  const gameName = input.value.trim();
  if (gameName === '') return;

  const res = await fetch('/api/games', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'authorization': getToken()
    },
    body: JSON.stringify({ name: gameName, status: 'muon-choi' })
  });

  const newGame = await res.json();
  renderGame(newGame);
  input.value = '';
});