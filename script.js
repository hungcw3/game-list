const form = document.getElementById('game-form');
const input = document.getElementById('game-name');
const list = document.getElementById('game-list');

// Lấy danh sách game từ server
async function loadGames() {
  const response = await fetch('/api/games');
  const games = await response.json();
  list.innerHTML = '';
  games.forEach(function(game) {
    renderGame(game);
  });
}

// Hiển thị 1 game lên danh sách
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

  // Cập nhật trạng thái lên server
  statusSelect.addEventListener('change', async function() {
    await fetch('/api/games/' + game.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: statusSelect.value })
    });
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Xóa';

  // Xóa game trên server
  deleteBtn.addEventListener('click', async function() {
    await fetch('/api/games/' + game.id, {
      method: 'DELETE'
    });
    list.removeChild(li);
  });

  li.appendChild(nameSpan);
  li.appendChild(statusSelect);
  li.appendChild(deleteBtn);
  list.appendChild(li);
}

// Thêm game mới lên server
form.addEventListener('submit', async function(e) {
  e.preventDefault();

  const gameName = input.value.trim();
  if (gameName === '') return;

  const response = await fetch('/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: gameName, status: 'muon-choi' })
  });

  const newGame = await response.json();
  renderGame(newGame);
  input.value = '';
});

// Chạy khi mở trang
loadGames();