const N = 9;
let grid = [];
let solvedGrid = [];
let timerInterval;
let errors = 0;

// Elements
const table = document.getElementById("sudoku-grid");
const errorDisplay = document.getElementById("errors");
const modal = document.getElementById("modal");
const modalClose = document.getElementById("modal-close");
const hintButton = document.getElementById("hint");
const difficultyBadge = document.getElementById("difficulty-badge");

function updateDifficultyBadge(level) {
    const emojis = {
        easy: "🐣 Easy",
        medium: "🧠 Medium",
        hard: "💀 Hard"
    };
    difficultyBadge.textContent = emojis[level] || "🧠 Medium";
}

// === GRID RENDERING ===
function printGrid() {
    table.innerHTML = "";
    errorDisplay.innerText = `Mistakes: ${errors}`;

    for (let i = 0; i < N; i++) {
        const row = document.createElement("tr");

        for (let j = 0; j < N; j++) {
            const cell = document.createElement("td");
            const input = document.createElement("input");

            input.type = "number";
            input.min = 1;
            input.max = 9;

            if (grid[i][j] !== 0) {
                input.value = grid[i][j];
                input.disabled = true;
            } else {
                input.addEventListener("input", (e) => {
                    const value = parseInt(e.target.value) || 0;

                    if (value >= 1 && value <= 9) {
                        const correct = value === solvedGrid[i][j];
                        if (correct) {
                            input.style.backgroundColor = "rgba(144, 238, 144, 0.6)";
                            grid[i][j] = value;
                            if (checkWin()) showWinModal();
                        } else {
                            input.style.backgroundColor = "rgba(255, 99, 71, 0.6)";
                            grid[i][j] = 0;
                            errors++;
                            errorDisplay.innerText = `Mistakes: ${errors}`;
                        }
                    } else {
                        input.style.backgroundColor = "";
                        grid[i][j] = 0;
                    }
                });
            }

            cell.appendChild(input);
            row.appendChild(cell);
        }

        table.appendChild(row);
    }
}

// === GAME LOGIC ===
function isSafe(grid, row, col, num) {
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);

    for (let i = 0; i < N; i++) {
        if (grid[row][i] === num || grid[i][col] === num) return false;
    }

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (grid[startRow + i][startCol + j] === num) return false;
        }
    }

    return true;
}

function generateSolvedGrid() {
    const grid = Array.from({ length: N }, () => Array(N).fill(0));

    function fillGrid() {
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                if (grid[i][j] === 0) {
                    const nums = shuffleArray([...Array(9)].map((_, k) => k + 1));
                    for (let num of nums) {
                        if (isSafe(grid, i, j, num)) {
                            grid[i][j] = num;
                            if (fillGrid()) return true;
                            grid[i][j] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    fillGrid();
    return grid;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// === PUZZLE GENERATION (Smart) ===
function generateNewPuzzle(targetDifficulty = "medium") {
    let tries = 0;

    while (tries < 50) {
        const candidate = generateSolvedGrid();
        const puzzle = JSON.parse(JSON.stringify(candidate));

        let removed = 0;
        while (removed < 40) {
            const r = Math.floor(Math.random() * 9);
            const c = Math.floor(Math.random() * 9);
            if (puzzle[r][c] !== 0) {
                puzzle[r][c] = 0;
                removed++;
            }
        }

        const level = classifyDifficulty(puzzle);
        if (level === targetDifficulty) {
            solvedGrid = candidate;
            return puzzle;
        }

        tries++;
    }

    console.warn("Fallback to basic puzzle");
    solvedGrid = generateSolvedGrid();
    return generateNewPuzzleBasic(targetDifficulty);
}

function generateNewPuzzleBasic(difficulty) {
    const base = JSON.parse(JSON.stringify(solvedGrid));
    const removeMap = { easy: 30, medium: 40, hard: 50 };
    const blanks = removeMap[difficulty] || 40;

    let removed = 0;
    while (removed < blanks) {
        const r = Math.floor(Math.random() * 9);
        const c = Math.floor(Math.random() * 9);
        if (base[r][c] !== 0) {
            base[r][c] = 0;
            removed++;
        }
    }

    return base;
}

function classifyDifficulty(puzzle) {
    let board = JSON.parse(JSON.stringify(puzzle));
    let techniques = {
        nakedSingles: 0,
        hiddenSingles: 0,
        advanced: 0
    };

    function getCandidates(row, col) {
        if (board[row][col] !== 0) return [];
        let candidates = new Set(Array.from({ length: 9 }, (_, i) => i + 1));

        for (let k = 0; k < N; k++) {
            candidates.delete(board[row][k]);
            candidates.delete(board[k][col]);
        }

        let boxRow = row - (row % 3);
        let boxCol = col - (col % 3);
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                candidates.delete(board[boxRow + i][boxCol + j]);
            }
        }

        return Array.from(candidates);
    }

    function solveStep() {
        let progress = false;

        // Naked singles
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                if (board[i][j] === 0) {
                    const candidates = getCandidates(i, j);
                    if (candidates.length === 1) {
                        board[i][j] = candidates[0];
                        techniques.nakedSingles++;
                        progress = true;
                    }
                }
            }
        }

        // Hidden singles
        function hiddenSingleInUnit(getCell) {
            for (let num = 1; num <= 9; num++) {
                let possible = [];
                for (let i = 0; i < 9; i++) {
                    const [r, c] = getCell(i);
                    if (board[r][c] === 0 && getCandidates(r, c).includes(num)) {
                        possible.push([r, c]);
                    }
                }
                if (possible.length === 1) {
                    const [r, c] = possible[0];
                    board[r][c] = num;
                    techniques.hiddenSingles++;
                    progress = true;
                }
            }
        }

        for (let i = 0; i < 9; i++) {
            hiddenSingleInUnit(j => [i, j]);
            hiddenSingleInUnit(j => [j, i]);
        }

        for (let br = 0; br < 3; br++) {
            for (let bc = 0; bc < 3; bc++) {
                hiddenSingleInUnit(j => [
                    3 * br + Math.floor(j / 3),
                    3 * bc + (j % 3)
                ]);
            }
        }

        return progress;
    }

    let steps = 0;
    while (solveStep() && steps < 100) steps++;

    const total = techniques.nakedSingles + techniques.hiddenSingles + techniques.advanced;
    if (total === 0) return "unsolvable";
    if (techniques.nakedSingles > total * 0.9) return "easy";
    if (techniques.hiddenSingles > 0) return "medium";
    return "hard";
}

// === UTILITIES ===
function startTimer() {
    const start = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - start) / 1000);
        const min = String(Math.floor(elapsed / 60)).padStart(2, "0");
        const sec = String(elapsed % 60).padStart(2, "0");
        document.getElementById("timer").innerText = `Time: ${min}:${sec}`;
    }, 1000);
}

function restartGame() {
    const difficultyLevel = document.getElementById("difficulty").value;
    updateDifficultyBadge(difficultyLevel);
    grid = generateNewPuzzle(difficultyLevel);
    errors = 0;
    printGrid();
    startTimer();
}

function checkWin() {
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (grid[i][j] !== solvedGrid[i][j]) return false;
        }
    }
    return true;
}

function showWinModal() {
    clearInterval(timerInterval);
    modal.classList.add("show");
}

function giveHint() {
    let emptyCells = [];
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (grid[i][j] === 0) emptyCells.push([i, j]);
        }
    }

    if (emptyCells.length === 0) return;
    const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    grid[row][col] = solvedGrid[row][col];
    printGrid();
    if (checkWin()) showWinModal();
}

// === EVENT BINDINGS ===
document.getElementById("restart").addEventListener("click", restartGame);
document.getElementById("difficulty").addEventListener("change", (e) => {
    updateDifficultyBadge(e.target.value);
    grid = generateNewPuzzle(e.target.value);
    errors = 0;
    printGrid();
    startTimer();
});
modalClose.addEventListener("click", () => modal.classList.remove("show"));
hintButton.addEventListener("click", giveHint);

// === INIT ===
grid = generateNewPuzzle("medium");
printGrid();
startTimer();
