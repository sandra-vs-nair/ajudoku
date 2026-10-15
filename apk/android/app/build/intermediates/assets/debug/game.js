(function () {
  const STORAGE = "ajudoku-progress-v1";
  const FACE_SRC = "aju-face.png";
  const FACE_ANGRY_SRC = "aju-face-angry.png";
  const DANCE_GIF_SRC = "maroon-shirt-funny-dance.gif";
  const MARRIAGE_VIDEO_SRC = "marriage.mov";
  const WRONG_AJU_MS = 750;
  const WIN_PAUSE_MS = 800;
  const levels = window.AJUDOKU_LEVELS;

  const EMPTY = 0;
  const XMARK = 1;
  const AJU = 2;

  const REGION_COLORS = [
    "#ffd6e8",
    "#d4f0ff",
    "#fff0c2",
    "#d8f5d0",
    "#e8dcff",
    "#ffe4cc",
    "#cce9ee",
    "#f5d6ff",
    "#e2f0cb",
    "#ffcfcf",
  ];

  const elBoard = document.getElementById("board");
  const elHearts = document.getElementById("hearts");
  const elLevelName = document.getElementById("level-name");

  function levelTitle(index) {
    const lv = levels[index];
    return "Level " + (index + 1) + ": " + lv.name;
  }
  const elToast = document.getElementById("toast");
  const elScreenHome = document.getElementById("screen-home");
  const elScreenPlay = document.getElementById("screen-play");
  const elTopbar = document.querySelector(".topbar");
  const elWinCelebration = document.getElementById("win-celebration");
  const elBtnNext = document.getElementById("btn-next");
  const elWinMessage = document.getElementById("win-message");
  const elAjuDanceWrap = document.querySelector(".aju-dance-wrap");
  const elAjuDanceGif = document.getElementById("aju-dance-gif");
  const elMarriageVideo = document.getElementById("marriage-video");
  const elBoardWrap = document.getElementById("board-wrap");
  const elToolbar = document.querySelector(".toolbar");
  let levelIndex = 0;
  let level = null;
  let state = [];
  let locked = [];
  let hearts = 3;
  let toastTimer = null;
  let animatingCells = new Set();
  let winPauseTimer = null;
  let winLocked = false;

  function solutionSet(sol) {
    const s = new Set();
    sol.forEach(function (p) {
      s.add(p[0] + "," + p[1]);
    });
    return s;
  }

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE) || "{}");
    } catch {
      return {};
    }
  }

  function saveProgress() {
    const p = loadProgress();
    p.current = levelIndex;
    localStorage.setItem(STORAGE, JSON.stringify(p));
  }

  function markComplete(id) {
    const p = loadProgress();
    p.completed = p.completed || [];
    if (p.completed.indexOf(id) === -1) p.completed.push(id);
    p.current = levelIndex;
    localStorage.setItem(STORAGE, JSON.stringify(p));
  }

  function showToast(msg) {
    elToast.textContent = msg;
    elToast.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      elToast.classList.add("hidden");
    }, 2000);
  }

  function renderHearts() {
    elHearts.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const span = document.createElement("span");
      span.textContent = "❤️";
      if (i >= hearts) span.classList.add("lost");
      elHearts.appendChild(span);
    }
  }

  function loseHeart() {
    if (hearts <= 0) return;
    hearts -= 1;
    renderHearts();
    if (hearts <= 0) {
      setTimeout(function () {
        showToast("Out of hearts — resetting this year.");
        loadLevel();
      }, WRONG_AJU_MS);
    }
  }

  function getAjus() {
    const ajus = [];
    const n = level.size;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (state[r][c] === AJU) ajus.push([r, c]);
      }
    }
    return ajus;
  }

  function violatesRules(r, c, ajus) {
    const rid = level.regions[r][c];
    for (let i = 0; i < ajus.length; i++) {
      const r2 = ajus[i][0];
      const c2 = ajus[i][1];
      if (r2 === r && c2 === c) continue;
      if (c2 === c) return true;
      if (level.regions[r2][c2] === rid) return true;
      if (Math.abs(r2 - r) <= 1 && Math.abs(c2 - c) <= 1) return true;
    }
    return false;
  }

  function appendFace(cell, angry) {
    cell.textContent = "";
    const img = document.createElement("img");
    img.src = angry ? FACE_ANGRY_SRC : FACE_SRC;
    img.alt = angry ? "Aju angry" : "Aju";
    img.className = "aju-face" + (angry ? " aju-face--angry" : "");
    img.draggable = false;
    cell.appendChild(img);
  }

  function cellAnimKey(r, c) {
    return r + "," + c;
  }

  function showWrongAju(cellEl, r, c, restoreState) {
    const key = cellAnimKey(r, c);
    if (animatingCells.has(key)) return;
    animatingCells.add(key);

    cellEl.classList.add("cell--wrong-aju", "has-aju");
    cellEl.style.background =
      REGION_COLORS[level.regions[r][c] % REGION_COLORS.length];
    appendFace(cellEl, true);

    setTimeout(function () {
      animatingCells.delete(key);
      cellEl.classList.remove("cell--wrong-aju", "has-aju");
      state[r][c] = restoreState;
      updateCellEl(cellEl, r, c);
    }, WRONG_AJU_MS);
  }

  function updateCellEl(cell, r, c) {
    cell.className = "cell";
    cell.style.background = REGION_COLORS[level.regions[r][c] % REGION_COLORS.length];
    cell.textContent = "";
    const v = state[r][c];
    if (v === XMARK) {
      cell.classList.add("x-mark");
      cell.textContent = "✕";
    } else if (v === AJU) {
      cell.classList.add("has-aju");
      if (locked[r][c]) cell.classList.add("locked");
      appendFace(cell);
    }
  }

  function renderBoard() {
    const n = level.size;
    elBoard.innerHTML = "";
    elBoard.style.gridTemplateColumns = "repeat(" + n + ", var(--cell))";

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "cell";
        cell.setAttribute("aria-label", "Row " + (r + 1) + " column " + (c + 1));
        updateCellEl(cell, r, c);
        cell.addEventListener("click", function () {
          onCellTap(r, c, cell);
        });
        elBoard.appendChild(cell);
      }
    }
  }

  function onCellTap(r, c, cellEl) {
    if (winLocked) return;
    if (animatingCells.has(cellAnimKey(r, c))) return;
    if (locked[r][c]) return;
    if (hearts <= 0) {
      showToast("No hearts left — reset the level.");
      return;
    }

    const v = state[r][c];
    if (v === EMPTY) {
      state[r][c] = XMARK;
      updateCellEl(cellEl, r, c);
      return;
    }
    if (v === XMARK) {
      const ajus = getAjus();
      if (violatesRules(r, c, ajus)) {
        showWrongAju(cellEl, r, c, XMARK);
        loseHeart();
        showToast("That breaks the rules here. −1 heart");
        return;
      }
      if (!solution.has(r + "," + c)) {
        showWrongAju(cellEl, r, c, EMPTY);
        loseHeart();
        showToast("Wrong spot! −1 heart");
        return;
      }
      state[r][c] = AJU;
      updateCellEl(cellEl, r, c);
      checkWin();
      return;
    }
    if (v === AJU) {
      state[r][c] = EMPTY;
      updateCellEl(cellEl, r, c);
    }
  }

  let solution = new Set();

  function clearWinPause() {
    clearTimeout(winPauseTimer);
    winPauseTimer = null;
    winLocked = false;
  }

  function hideWinCelebration() {
    clearWinPause();
    elAjuDanceWrap.classList.remove("aju-dance-wrap--marriage");
    elMarriageVideo.pause();
    elMarriageVideo.classList.add("hidden");
    elAjuDanceGif.classList.remove("hidden");
    elWinCelebration.classList.add("hidden");
    elBoardWrap.classList.remove("play-ui-hidden");
    elToolbar.classList.remove("play-ui-hidden");
  }

  function showWinCelebration() {
    const allDone = levelIndex === levels.length - 1;
    elWinMessage.textContent = allDone
      ? "Aju married Kunju!!!"
      : "Aju is happy!!!";
    elBtnNext.textContent = allDone ? "Home" : "Next year";
    elBoardWrap.classList.add("play-ui-hidden");
    elToolbar.classList.add("play-ui-hidden");
    if (allDone) {
      elAjuDanceWrap.classList.add("aju-dance-wrap--marriage");
      elAjuDanceGif.classList.add("hidden");
      elMarriageVideo.classList.remove("hidden");
      elMarriageVideo.src = MARRIAGE_VIDEO_SRC + "?" + Date.now();
      elMarriageVideo.load();
      elMarriageVideo.play().catch(function () {
        showToast("Tap the video to play.");
      });
    } else {
      elAjuDanceWrap.classList.remove("aju-dance-wrap--marriage");
      elMarriageVideo.pause();
      elMarriageVideo.classList.add("hidden");
      elAjuDanceGif.classList.remove("hidden");
      elAjuDanceGif.alt = "Aju dancing";
      elAjuDanceGif.src = DANCE_GIF_SRC + "?" + Date.now();
    }
    elWinCelebration.classList.remove("hidden");
  }

  function checkWin() {
    const ajus = getAjus();
    if (ajus.length !== level.size) return;
    for (let i = 0; i < ajus.length; i++) {
      if (!solution.has(ajus[i][0] + "," + ajus[i][1])) return;
    }
    markComplete(level.id);
    if (winLocked) return;
    winLocked = true;
    clearTimeout(winPauseTimer);
    winPauseTimer = setTimeout(function () {
      winPauseTimer = null;
      winLocked = false;
      showWinCelebration();
    }, WIN_PAUSE_MS);
  }

  function loadLevel() {
    clearWinPause();
    level = levels[levelIndex];
    solution = solutionSet(level.solution);
    const n = level.size;
    state = [];
    locked = [];
    for (let r = 0; r < n; r++) {
      state[r] = [];
      locked[r] = [];
      for (let c = 0; c < n; c++) {
        state[r][c] = EMPTY;
        locked[r][c] = false;
      }
    }
    level.givens.forEach(function (p) {
      state[p[0]][p[1]] = AJU;
      locked[p[0]][p[1]] = true;
    });

    hearts = 3;
    animatingCells = new Set();
    elLevelName.textContent = levelTitle(levelIndex);
    renderHearts();
    renderBoard();
    hideWinCelebration();
    saveProgress();
  }

  function resetLevel() {
    loadLevel();
    showToast("Board reset.");
  }

  function giveHint() {
    if (winLocked) return;
    if (hearts <= 0) return;
    for (let i = 0; i < level.solution.length; i++) {
      const r = level.solution[i][0];
      const c = level.solution[i][1];
      if (state[r][c] !== AJU) {
        state[r][c] = AJU;
        locked[r][c] = true;
        renderBoard();
        showToast("Hint: one Aju placed.");
        checkWin();
        return;
      }
    }
    showToast("Every Aju is already placed!");
  }

  function renderHomeLevels() {
    const el = document.getElementById("home-level-list");
    if (!el) return;
    el.innerHTML = "";
    levels.forEach(function (lv, idx) {
      const li = document.createElement("li");
      li.className = "home-level-item";
      const label = document.createElement("span");
      label.className = "home-level-name";
      label.textContent = "Level " + (idx + 1) + ": " + lv.name;
      const year = document.createElement("span");
      year.className = "home-level-year";
      year.textContent = String(lv.id);
      li.appendChild(label);
      li.appendChild(year);
      el.appendChild(li);
    });
  }

  function showHome() {
    elScreenHome.classList.remove("hidden");
    elScreenPlay.classList.add("hidden");
    elTopbar.classList.add("topbar--home");
  }

  function showPlay() {
    elScreenHome.classList.add("hidden");
    elScreenPlay.classList.remove("hidden");
    elTopbar.classList.remove("topbar--home");
  }

  function startGame() {
    levelIndex = 0;
    showPlay();
    loadLevel();
  }

  document.getElementById("btn-start").addEventListener("click", startGame);
  document.getElementById("btn-home").addEventListener("click", showHome);
  document.getElementById("btn-reset").addEventListener("click", resetLevel);
  document.getElementById("btn-hint").addEventListener("click", giveHint);
  document.getElementById("btn-next").addEventListener("click", function () {
    hideWinCelebration();
    if (levelIndex < levels.length - 1) {
      levelIndex += 1;
      loadLevel();
    } else {
      showToast("Aju and Kunju — happily ever after!");
      showHome();
    }
  });

  renderHomeLevels();
  showHome();
})();
