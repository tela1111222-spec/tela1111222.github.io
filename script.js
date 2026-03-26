/* ============================================
   Gomoku — Game Logic
   ============================================ */
(() => {
  'use strict';

  // === Constants ===
  const SIZE = 15;
  const WIN_COUNT = 5;
  const BLACK = 1;
  const WHITE = 2;

  // === DOM refs ===
  const boardEl = document.getElementById('board');
  const statusText = document.getElementById('status-text');
  const turnStone = document.getElementById('turn-stone');
  const restartBtn = document.getElementById('restart-btn');
  const overlayRestartBtn = document.getElementById('overlay-restart-btn');
  const victoryOverlay = document.getElementById('victory-overlay');
  const victoryText = document.getElementById('victory-text');
  const victoryIcon = document.getElementById('victory-icon');
  const scoreBlackEl = document.getElementById('score-black');
  const scoreWhiteEl = document.getElementById('score-white');

  // === State ===
  let grid = [];        // 2D array: 0 = empty, 1 = black, 2 = white
  let currentPlayer = BLACK;
  let gameOver = false;
  let lastMove = null;
  let scores = { black: 0, white: 0 };

  // === Board Setup ===
  function buildBoard() {
    boardEl.innerHTML = '';
    boardEl.classList.remove('game-over');

    const cellSize = parseCellSize();

    // Draw grid lines
    for (let i = 0; i < SIZE; i++) {
      const hLine = document.createElement('div');
      hLine.className = 'grid-line-h';
      hLine.style.top = `${cellSize / 2 + i * cellSize}px`;
      boardEl.appendChild(hLine);

      const vLine = document.createElement('div');
      vLine.className = 'grid-line-v';
      vLine.style.left = `${cellSize / 2 + i * cellSize}px`;
      boardEl.appendChild(vLine);
    }

    // Star points (天元 + 星位)
    const starPositions = [
      [3, 3], [3, 7], [3, 11],
      [7, 3], [7, 7], [7, 11],
      [11, 3], [11, 7], [11, 11]
    ];
    starPositions.forEach(([r, c]) => {
      const dot = document.createElement('div');
      dot.className = 'star-point';
      dot.style.left = `${cellSize / 2 + c * cellSize}px`;
      dot.style.top = `${cellSize / 2 + r * cellSize}px`;
      boardEl.appendChild(dot);
    });

    // Cells (click targets)
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.style.left = `${cellSize / 2 + c * cellSize}px`;
        cell.style.top = `${cellSize / 2 + r * cellSize}px`;
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.id = `cell-${r}-${c}`;
        cell.addEventListener('click', onCellClick);
        boardEl.appendChild(cell);
      }
    }
  }

  function parseCellSize() {
    const style = getComputedStyle(boardEl);
    return parseFloat(style.getPropertyValue('--cell-size'));
  }

  // === Game Init ===
  function initGame() {
    grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    currentPlayer = BLACK;
    gameOver = false;
    lastMove = null;
    victoryOverlay.classList.add('hidden');
    updateStatus();
    buildBoard();
  }

  // === Place stone ===
  function onCellClick(e) {
    if (gameOver) return;
    const r = parseInt(e.currentTarget.dataset.row);
    const c = parseInt(e.currentTarget.dataset.col);
    if (grid[r][c] !== 0) return;

    placeStone(r, c);
  }

  function placeStone(r, c) {
    grid[r][c] = currentPlayer;
    const cell = document.getElementById(`cell-${r}-${c}`);
    cell.classList.add('occupied');

    // Remove last-move indicator from previous stone
    if (lastMove) {
      const prevCell = document.getElementById(`cell-${lastMove.r}-${lastMove.c}`);
      const prevStone = prevCell.querySelector('.stone');
      if (prevStone) prevStone.classList.remove('last-move');
    }

    // Create stone element
    const stone = document.createElement('div');
    stone.className = `stone ${currentPlayer === BLACK ? 'black' : 'white'} last-move`;
    cell.appendChild(stone);
    lastMove = { r, c };

    // Check win
    const winCells = checkWin(r, c, currentPlayer);
    if (winCells) {
      endGame(currentPlayer, winCells);
      return;
    }

    // Check draw
    if (isBoardFull()) {
      endGame(null, null);
      return;
    }

    // Switch turn
    currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
    updateStatus();
  }

  // === Win Detection ===
  function checkWin(r, c, player) {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal ↘
      [1, -1],  // diagonal ↙
    ];

    for (const [dr, dc] of directions) {
      const cells = [[r, c]];

      // Count forward
      for (let i = 1; i < WIN_COUNT; i++) {
        const nr = r + dr * i;
        const nc = c + dc * i;
        if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) break;
        if (grid[nr][nc] !== player) break;
        cells.push([nr, nc]);
      }

      // Count backward
      for (let i = 1; i < WIN_COUNT; i++) {
        const nr = r - dr * i;
        const nc = c - dc * i;
        if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) break;
        if (grid[nr][nc] !== player) break;
        cells.push([nr, nc]);
      }

      if (cells.length >= WIN_COUNT) return cells;
    }

    return null;
  }

  function isBoardFull() {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) return false;
      }
    }
    return true;
  }

  // === End Game ===
  function endGame(winner, winCells) {
    gameOver = true;
    boardEl.classList.add('game-over');

    if (winner) {
      // Highlight winning stones
      winCells.forEach(([wr, wc]) => {
        const cell = document.getElementById(`cell-${wr}-${wc}`);
        const stone = cell.querySelector('.stone');
        if (stone) stone.classList.add('win-highlight');
      });

      const name = winner === BLACK ? '黑子' : '白子';
      statusText.textContent = `🎉 ${name} 獲勝！`;

      // Update score
      if (winner === BLACK) {
        scores.black++;
        scoreBlackEl.textContent = scores.black;
      } else {
        scores.white++;
        scoreWhiteEl.textContent = scores.white;
      }

      // Show overlay after brief delay so player sees the board
      setTimeout(() => showVictoryOverlay(winner), 600);
    } else {
      statusText.textContent = '平局！棋盤已滿';
      setTimeout(() => showVictoryOverlay(null), 600);
    }
  }

  function showVictoryOverlay(winner) {
    if (winner) {
      const name = winner === BLACK ? '黑子' : '白子';
      victoryText.textContent = `🎉 ${name} 獲勝！`;
      victoryIcon.className = 'victory-icon';
      victoryIcon.classList.add(winner === BLACK ? 'black-icon' : 'white-icon');
    } else {
      victoryText.textContent = '平局！棋盤已滿';
      victoryIcon.className = 'victory-icon';
      victoryIcon.style.background = 'linear-gradient(135deg, #555, #aaa)';
    }
    victoryOverlay.classList.remove('hidden');
  }

  // === Status Update ===
  function updateStatus() {
    const name = currentPlayer === BLACK ? '黑子' : '白子';
    statusText.textContent = `${name}的回合`;
    turnStone.className = `stone-icon ${currentPlayer === BLACK ? 'black-icon' : 'white-icon'}`;
  }

  // === Event Listeners ===
  restartBtn.addEventListener('click', initGame);
  overlayRestartBtn.addEventListener('click', initGame);

  // Close overlay when clicking outside content
  victoryOverlay.addEventListener('click', (e) => {
    if (e.target === victoryOverlay) {
      victoryOverlay.classList.add('hidden');
    }
  });

  // Rebuild board on resize (to recalc cell sizes from CSS)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!gameOver) {
        rebuildBoardFromState();
      }
    }, 250);
  });

  function rebuildBoardFromState() {
    boardEl.innerHTML = '';
    const cellSize = parseCellSize();

    // Grid lines
    for (let i = 0; i < SIZE; i++) {
      const hLine = document.createElement('div');
      hLine.className = 'grid-line-h';
      hLine.style.top = `${cellSize / 2 + i * cellSize}px`;
      boardEl.appendChild(hLine);

      const vLine = document.createElement('div');
      vLine.className = 'grid-line-v';
      vLine.style.left = `${cellSize / 2 + i * cellSize}px`;
      boardEl.appendChild(vLine);
    }

    // Star points
    const starPositions = [
      [3, 3], [3, 7], [3, 11],
      [7, 3], [7, 7], [7, 11],
      [11, 3], [11, 7], [11, 11]
    ];
    starPositions.forEach(([r, c]) => {
      const dot = document.createElement('div');
      dot.className = 'star-point';
      dot.style.left = `${cellSize / 2 + c * cellSize}px`;
      dot.style.top = `${cellSize / 2 + r * cellSize}px`;
      boardEl.appendChild(dot);
    });

    // Cells + existing stones
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.style.left = `${cellSize / 2 + c * cellSize}px`;
        cell.style.top = `${cellSize / 2 + r * cellSize}px`;
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.id = `cell-${r}-${c}`;
        cell.addEventListener('click', onCellClick);

        if (grid[r][c] !== 0) {
          cell.classList.add('occupied');
          const stone = document.createElement('div');
          const isLast = lastMove && lastMove.r === r && lastMove.c === c;
          stone.className = `stone ${grid[r][c] === BLACK ? 'black' : 'white'}${isLast ? ' last-move' : ''}`;
          stone.style.animation = 'none';
          stone.style.transform = 'translate(-50%, -50%) scale(1)';
          cell.appendChild(stone);
        }

        boardEl.appendChild(cell);
      }
    }
  }

  // === Start ===
  initGame();
})();
