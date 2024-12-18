let N = 9;
let grid = [];
let solvedGrid = [];
let timerInterval;

// Function to print the grid in HTML
function printGrid() {
    const table = document.getElementById("sudoku-grid");
    table.innerHTML = ""; // Clear the table before rendering

    for (let i = 0; i < N; i++) {
        const row = document.createElement("tr");

        for (let j = 0; j < N; j++) {
            const cell = document.createElement("td");
            const input = document.createElement("input");

            if (grid[i][j] !== 0) {
                input.value = grid[i][j]; // Pre-fill the grid with initial numbers
                input.disabled = true; // Make non-empty cells read-only
            } else {
                input.type = "number";
                input.min = 1;
                input.max = 9;

                // Real-time validation and feedback
                input.addEventListener("input", (e) => {
                    const value = parseInt(e.target.value) || 0;
                    if (value >= 1 && value <= 9) {
                        if (value === solvedGrid[i][j]) {
                            input.style.backgroundColor = "rgba(144, 238, 144, 0.6)"; // Correct entry with haze
                            grid[i][j] = value;
                        } else {
                            input.style.backgroundColor = "rgba(255, 99, 71, 0.6)"; // Incorrect entry with haze
                            grid[i][j] = 0;
                        }
                    } else {
                        input.style.backgroundColor = ""; // Reset background for invalid input
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

// Check if the number can be placed in the given row, column, and 3x3 box
function isSafe(grid, row, col, num) {
    for (let x = 0; x < N; x++) {
        if (grid[row][x] === num || grid[x][col] === num) {
            return false;
        }
    }

    let startRow = row - row % 3;
    let startCol = col - col % 3;

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (grid[i + startRow][j + startCol] === num) {
                return false;
            }
        }
    }
    return true;
}

// Generate a fully solved Sudoku grid
function generateSolvedGrid() {
    let grid = Array.from({ length: N }, () => Array(N).fill(0));

    function fillGrid() {
        let row, col;
        let isEmpty = true;

        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                if (grid[i][j] === 0) {
                    row = i;
                    col = j;
                    isEmpty = false;
                    break;
                }
            }
            if (!isEmpty) break;
        }

        if (isEmpty) return true;

        let nums = Array.from({ length: 9 }, (_, i) => i + 1);
        shuffleArray(nums); // Shuffle numbers to create unique grids

        for (let num of nums) {
            if (isSafe(grid, row, col, num)) {
                grid[row][col] = num;
                if (fillGrid()) return true;
                grid[row][col] = 0;
            }
        }
        return false;
    }

    fillGrid();
    return grid;
}

// Shuffle an array (Fisher-Yates Shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Generate a new puzzle by removing numbers
function generateNewPuzzle(difficulty) {
    solvedGrid = generateSolvedGrid();
    let puzzle = JSON.parse(JSON.stringify(solvedGrid));

    let difficultyMap = {
        easy: 30,
        medium: 40,
        hard: 50
    };

    let cellsToRemove = difficultyMap[difficulty] || 40;
    let count = 0;

    while (count < cellsToRemove) {
        let row = Math.floor(Math.random() * N);
        let col = Math.floor(Math.random() * N);

        if (puzzle[row][col] !== 0) {
            puzzle[row][col] = 0;
            count++;
        }
    }

    return puzzle;
}

// Timer function
function startTimer() {
    let startTime = Date.now();

    function updateTimer() {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, "0");
        const seconds = (elapsed % 60).toString().padStart(2, "0");
        document.getElementById("timer").innerText = `Time: ${minutes}:${seconds}`;
    }

    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
}

// Restart game function
function restartGame() {
    const difficultyLevel = document.getElementById("difficulty").value;
    grid = generateNewPuzzle(difficultyLevel);
    printGrid();
    startTimer();
}

// Initial setup
grid = generateNewPuzzle("medium");
printGrid();
startTimer();

// Event Listeners
document.getElementById("restart").addEventListener("click", restartGame);
document.getElementById("difficulty").addEventListener("change", (e) => {
    grid = generateNewPuzzle(e.target.value);
    printGrid();
    startTimer();
});
