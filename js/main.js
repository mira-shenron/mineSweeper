'use strict';

var gBoard;
var gLevel;
var gGame;
var gFirstClick;
var gInterval;
var gGameStartTimestamp;
var gNumOfMines;
var gLives;
var gHints;
var gIsHintUsed = false;



initLocalStorage();
function initLocalStorage(){
if (localStorage.getItem('beginner') !== '0:0' || localStorage.getItem('medium') !== '0:0' || localStorage.getItem('expert') !== '0:0') {
    //do nothing, storage already exists
} else {
    localStorage.setItem('beginner', '0:0');
    localStorage.setItem('medium', '0:0');
    localStorage.setItem('expert', '0:0');
}
}

function initGame(elBtn, levelName) {

    gGame = resetGame();
    gLives = 3;
    renderLives(gLives);

    gHints = 3;
    renderHints(gHints);

    var level = 'beginner';
    if (elBtn !== undefined) {
        level = elBtn.name;
    }
    else if (levelName !== undefined) {
        level = levelName;
    }

    gLevel = initLevel(level);
    renderBestScore(gLevel.name);
    gNumOfMines = gLevel.MINES;
    gBoard = buildBoard();


    renderSmiley('😃');
    renderMines(gLevel.MINES);
    renderBoard(gBoard);
}

function renderHints(hintsNum) {
    var elHint1 = document.querySelector('.firstHint');
    var elHint2 = document.querySelector('.secondHint');
    var elHint3 = document.querySelector('.thirdHint');

    elHint1.innerText = '💡';
    elHint2.innerText = '💡';
    elHint3.innerText = '💡';
}

function useHint(elSpanHint) {
    gIsHintUsed = true;
    gHints--;
    elSpanHint.innerText = '👌';
}

function restartLevel() {
    initGame(undefined, gLevel.name);
}

function renderMines() {
    var elMinesNum = document.querySelector('.mines span');
    elMinesNum.innerText = gLevel.MINES;
}

function resetGameTime() {
    var elSec = document.querySelector('.timer span');
    elSec.innerText = '0:0';
}

function startStopwatch() {
    gGameStartTimestamp = new Date();
    gInterval = setInterval(printGameTime, 1);
}

function printGameTime() {
    var elTime = document.querySelector('.timer span');
    var currTime = new Date();
    var timePassed = new Date(currTime - gGameStartTimestamp);
    elTime.innerText = timePassed.getMinutes() + ':' + timePassed.getSeconds();
}

function resetGame() {
    var elBody = document.querySelector('body');
    elBody.pointerEvents = 'auto';

    resetGameTime();
    clearInterval(gInterval);
    gFirstClick = true;

    var game = {
        isOn: true,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0
    };
    return game;
}

function initLevel(levelName) {
    var level;
    switch (levelName) {
        case 'expert':
            level = { SIZE: 12, MINES: 30, name: 'expert' };
            break;
        case 'medium':
            level = { SIZE: 8, MINES: 12, name: 'medium' };
            break;
        default:
            level = { SIZE: 4, MINES: 2, name: 'beginner' };
            break;
    }
    return level;
}

function buildBoard(iFirst, jFirst) {
    var board = [];

    for (var i = 0; i < gLevel.SIZE; i++) {
        board[i] = [];
        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j] = {
                i, j,
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false,
                elemToPrint: ''
            };
        }
    }

    return board;
}

function setMinesNegsCount(board) {
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = board[i][j];
            var numOfMines = countMinesNegs(cell, board);
            cell.minesAroundCount = numOfMines;
            if (!cell.isMine && !cell.isMarked && numOfMines > 0) {
                cell.elemToPrint = numOfMines;
            }
        }
    }
}

function countMinesNegs(cell, board) {
    var count = 0;

    for (var i = cell.i - 1; i <= cell.i + 1; i++) {
        if (i < 0 || i >= gLevel.SIZE) {
            continue;
        }
        for (var j = cell.j - 1; j <= cell.j + 1; j++) {
            if (j < 0 || j >= gLevel.SIZE) {
                continue;
            }
            if (i === cell.i && j === cell.j) {
                continue;
            }

            if (board[i][j].isMine) {
                count++;
            };
        }
    }
    return count;
}

function setMines(board, iFirst, jFirst) {
    var minesCounter = 0;
    while (minesCounter < gNumOfMines) {
        var i = getRandonInt(0, gLevel.SIZE - 1);
        var j = getRandonInt(0, gLevel.SIZE - 1);

        if (!board[i][j].isMine && i !== iFirst && j !== jFirst) {
            board[i][j].isMine = true;
            minesCounter++;
            if (!board[i][j].isMarked) board[i][j].elemToPrint = '💣';
        }
    }
    return board;
}


function getClassName(location) {
    var cellClass = 'cell-' + location.i + '-' + location.j;
    return cellClass;
}

function renderBoard(board) {
    var elBoard = document.querySelector('.board');
    var strHTML = '';

    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>\n';
        for (var j = 0; j < board[0].length; j++) {
            var currCell = board[i][j];
            var cellClass = getClassName({ i: i, j: j });
            var isOpenClass = '';
            if (currCell.isShown) {
                isOpenClass = 'open';
            }

            strHTML += `\t<td class="cell ${cellClass} ${isOpenClass}"  onmousedown="cellClicked(${i}, ${j}, event)">\n`;
            if (currCell.isShown || currCell.isMarked) {
                strHTML += currCell.elemToPrint;
            }
            strHTML += '\t</td>\n';
        }
        strHTML += '</tr>\n';
    }
    elBoard.innerHTML = strHTML;
}

function handleOpenCell(cell) {
    var isLost = false;

    if (gIsHintUsed) {
        gIsHintUsed = false;
        gHints--;
        revealCellAndNegsForSecond(cell);
        return;
    }

    if (cell.isMine) {
        if (gLives === 1) {
            cell.isShown = true;
            renderCell({ i: cell.i, j: cell.j }, cell.elemToPrint, cell.isShown);

            var isLost = true;
            gameOver(isLost);
            revealAllMines();
        } else {
            gLives--;
            renderLives(gLives);
            showBombInDiffColorAndClose({ i: cell.i, j: cell.j });
            return;
        }
    } else {
        cell.isShown = true;
        renderCell({ i: cell.i, j: cell.j }, cell.elemToPrint, cell.isShown);
        checkVictory();
        //if empty cell open its neighbors
        if (cell.minesAroundCount === 0) {
            openNegs(cell);
        }
    }
}


function revealCellAndNegsForSecond(cell) {
    var negs = [];
    for (var i = cell.i - 1; i <= cell.i + 1; i++) {
        if (i < 0 || i >= gLevel.SIZE) {
            continue;
        }
        for (var j = cell.j - 1; j <= cell.j + 1; j++) {
            if (j < 0 || j >= gLevel.SIZE) {
                continue;
            }
            if (!gBoard[i][j].isShown) {
                negs.push(gBoard[i][j]);
            }
        }
    }

    for (var idx = 0; idx < negs.length; idx++) {
        var neg = negs[idx];
        var cellSelector = '.' + getClassName({ i: neg.i, j: neg.j });
        var elCell = document.querySelector(cellSelector);

        elCell.classList.add('revealed');
        var elToPrint = neg.elemToPrint;
        if (neg.isMarked) {
            if (neg.isMine) {
                elToPrint = '💣';
            } else {
                elToPrint = (neg.minesAroundCount === 0) ? '' : neg.minesAroundCount;
            }
        }
        elCell.innerText = elToPrint;
    }

    setTimeout(function () {
        for (var idx = 0; idx < negs.length; idx++) {
            var neg = negs[idx];
            var cellSelector = '.' + getClassName({ i: neg.i, j: neg.j });
            var elCell = document.querySelector(cellSelector);

            elCell.classList.remove('revealed');
            elToPrint = (neg.isMarked) ? '⛳' : '';
            elCell.innerText = elToPrint;
        }
    }, 1000);
}


function renderLives(livesNum) {
    var elLives = document.querySelector('.lives span');
    var lives = ''
    for (var i = 0; i < livesNum; i++) {
        lives += '❤️';
    }
    elLives.innerText = lives;
}

function checkVictory() {
    var openCells = 0;
    var markedCells = 0;
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            if (gBoard[i][j].isShown) {
                openCells++;
            } else if (gBoard[i][j].isMarked) {
                markedCells++;
            }
        }
    }

    if (openCells === (gLevel.SIZE * gLevel.SIZE - gNumOfMines) && markedCells === gNumOfMines) {
        var isLost = false;
        gameOver(isLost);
    }
}

function openNegs(cell) {
    for (var i = cell.i - 1; i <= cell.i + 1; i++) {
        if (i < 0 || i >= gLevel.SIZE) {
            continue;
        }
        for (var j = cell.j - 1; j <= cell.j + 1; j++) {
            if (j < 0 || j >= gLevel.SIZE) {
                continue;
            }
            if (i === cell.i && j === cell.j) {
                continue;
            }

            if (!gBoard[i][j].isMarked) {
                gBoard[i][j].isShown = true;

                renderCell({ i: i, j: j }, gBoard[i][j].elemToPrint, gBoard[i][j].isShown);
                checkVictory();
            }
        }
    }
}


function compareTimes(time, score) {
    var timeMinSec = time.split(':');
    var timeMin = +timeMinSec[0];
    var timeSec = +timeMinSec[1];
    var scoreMinSec = score.split(':');
    var scoreMin = +scoreMinSec[0];
    var scoreSec = +scoreMinSec[1];

    if (timeMin < scoreMin) {
        return true;
    } else if (timeMin === scoreMin) {
        if (timeSec < scoreSec) {
            return true;
        }
    }
}

function handleBestScore() {
    var elTime = document.querySelector('.timer span');
    var time = elTime.innerText;
    var score = localStorage.getItem(gLevel.name);
    compareTimes(time, score);
    if (compareTimes(time, score) || score === '0:0') {
        localStorage.setItem(gLevel.name, time);
        renderBestScore(gLevel.name);
    }
}


function renderBestScore(levelName) {
    var bestScore = localStorage.getItem(levelName);
    var elScore = document.querySelector('.score span');
    elScore.innerText = bestScore;
}

function gameOver(isLost) {
    renderLives(0);
    clearInterval(gInterval);
    gGame.isOn = false;
    handleBestScore();

    if (isLost) {
        renderSmiley('🤯');
    } else {
        renderSmiley('😎');
    }

    var elBody = document.querySelector('body');
    elBody.pointerEvents = 'none';
}

function renderSmiley(smiley) {
    var elSmiley = document.querySelector('.smiley span');
    elSmiley.innerText = smiley;
}

function revealAllMines() {
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            if (gBoard[i][j].isMine) {
                gBoard[i][j].isShown = true;
                gBoard[i][j].elemToPrint = '💣';
                gBoard[i][j].isMarked = false;

                renderCell({ i: i, j: j }, gBoard[i][j].elemToPrint, gBoard[i][j].isShown);
            }
        }
    }
}


function cellClicked(i, j, ev) {
    const LEFT_CLICK = 1;
    const RIGHT_CLICK = 3;

    if (!gGame.isOn) {
        return;
    }

    if (ev.which === LEFT_CLICK) {
        if (gFirstClick) handleFirstLeftClick(i, j);
        if (gBoard[i][j].isShown) return;
        if (!gBoard[i][j].isMarked) handleOpenCell(gBoard[i][j]);
    }

    if (ev.which === RIGHT_CLICK) {
        if (gBoard[i][j].isShown) return;

        if (!gBoard[i][j].isMarked) {
            gBoard[i][j].isMarked = true;
            gBoard[i][j].elemToPrint = '⛳';
            gLevel.MINES--;

            checkVictory();

        } else {
            gBoard[i][j].isMarked = false;
            gBoard[i][j].elemToPrint = '';
            gLevel.MINES++;
        }

        renderCell({ i: i, j: j }, gBoard[i][j].elemToPrint, gBoard[i][j].isShown);
        renderMines();
    }
}

function renderCell(location, value, isShown) {
    var cellSelector = '.' + getClassName(location)
    var elCell = document.querySelector(cellSelector);
    if (isShown) elCell.classList.add('open');
    elCell.innerHTML = value;
}

function showBombInDiffColorAndClose(loc) {
    var cellSelector = '.' + getClassName(loc)
    var elCell = document.querySelector(cellSelector);
    elCell.innerText = '💥';

    setTimeout(function () {
        elCell.innerText = '';
    }, 100)
}

function handleFirstLeftClick(i, j) {
    gFirstClick = false;
    setMines(gBoard, i, j);
    setMinesNegsCount(gBoard);
    startStopwatch();
}

