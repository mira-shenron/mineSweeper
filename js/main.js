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
var gSafeClickCounter;
var gBoardStack;
var gMinesNumStack;


function initLocalStorage() {
    if (localStorage.getItem('beginner') !== '0:0' || localStorage.getItem('medium') !== '0:0' || localStorage.getItem('expert') !== '0:0') {
        //do nothing, storage already exists
    } else {
        localStorage.setItem('beginner', '0:0');
        localStorage.setItem('medium', '0:0');
        localStorage.setItem('expert', '0:0');
    }
}


function initGame(elBtn, levelName) {

    initLocalStorage();
    gGame = resetGame();
    
    renderLives(gLives);
    renderHints();
    renderSafeClick();

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


function renderSafeClick() {
    var elCounter = document.querySelector('.num');
    elCounter.innerText = gSafeClickCounter;
}

function renderHints() {
    var elHint1 = document.querySelector('.first-hint');
    var elHint2 = document.querySelector('.second-hint');
    var elHint3 = document.querySelector('.third-hint');

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

function renderMines(minesNum) {
    var elMinesNum = document.querySelector('.mines span');
    elMinesNum.innerText = minesNum;
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

    gBoardStack = [];
    gMinesNumStack = [];
    gSafeClickCounter = 3;
    gLives = 3;
    gHints = 3;

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

function buildBoard() {
    var board = [];

    for (var i = 0; i < gLevel.SIZE; i++) {
        board[i] = [];
        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j] = {
                i, j,
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            };
        }
    }

    return board;
}

function setMinesNegsCount() {
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = gBoard[i][j];
            var numOfMines = countMinesNegs(cell);
            cell.minesAroundCount = numOfMines;
        }
    }
}

function countMinesNegs(cell) {
    var count = 0;

    for (var i = cell.i - 1; i <= cell.i + 1; i++) {
        if (i < 0 || i >= gLevel.SIZE) continue;
            
        for (var j = cell.j - 1; j <= cell.j + 1; j++) {
            if (j < 0 || j >= gLevel.SIZE)  continue;
            if (i === cell.i && j === cell.j) continue; 

            if (gBoard[i][j].isMine) {
                count++;
            }
        }
    }
    return count;
}

function setMines(iFirst, jFirst) {
    var minesCounter = 0;
    while (minesCounter < gNumOfMines) {
        var i = getRandonInt(0, gLevel.SIZE - 1);
        var j = getRandonInt(0, gLevel.SIZE - 1);

        if (!gBoard[i][j].isMine && i !== iFirst && j !== jFirst) {
            gBoard[i][j].isMine = true;
            minesCounter++;
        }
    }
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
            strHTML += getValueFromCell(currCell);
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
            renderCell({ i: cell.i, j: cell.j }, cell);

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
        var newGboard = copyMat(gBoard);
        gBoardStack.push(newGboard);
        gMinesNumStack.push(gLevel.MINES);

        openNegs(cell.i, cell.j);
    }
}

function copyMat(mat) {
    var newMat = [];

    for (var i = 0; i < mat.length; i++) {
        newMat[i] = [];
        for (var j = 0; j < mat[0].length; j++) {
            newMat[i][j] = copyCell(mat[i][j]);
        }
    }
    return newMat;
}

function copyCell(cell) {
    var newCell = {
        i: cell.i,
        j: cell.j,
        minesAroundCount: cell.minesAroundCount,
        isShown: cell.isShown,
        isMine: cell.isMine,
        isMarked: cell.isMarked
    };

    return newCell;
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
        neg.isShown = true;
        var elToPrint = getValueFromCell(neg);
        elCell.innerText = elToPrint;
    }

    setTimeout(function () {
        for (var idx = 0; idx < negs.length; idx++) {
            var neg = negs[idx];
            var cellSelector = '.' + getClassName({ i: neg.i, j: neg.j });
            var elCell = document.querySelector(cellSelector);

            elCell.classList.remove('revealed');
            elCell.classList.remove('open');
            neg.isShown = false;
            elCell.innerText = getValueFromCell(neg);
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

function openNegs(i, j) {
    if (i >= gLevel.SIZE || j >= gLevel.SIZE || i < 0 || j < 0) {
        return;
    }

    if (gBoard[i][j].isMarked || gBoard[i][j].isShown) {
        return;
    }

    gBoard[i][j].isShown = true;
    renderCell({ i: i, j: j }, gBoard[i][j]);
    checkVictory();

    if (gBoard[i][j].minesAroundCount !== 0) {
        return;
    }

    openNegs(i - 1, j);
    openNegs(i, j - 1);
    openNegs(i, j + 1);
    openNegs(i + 1, j);

    openNegs(i + 1, j + 1);
    openNegs(i - 1, j - 1);
    openNegs(i - 1, j + 1);
    openNegs(i + 1, j - 1);
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
    if (!isLost) {
        handleBestScore();
    }

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
    var value;
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {

            if (gBoard[i][j].minesAroundCount === 0) {
                value = '';
            } else {
                value = gBoard[i][j].minesAroundCount;
            }

            if (gBoard[i][j].isMine) {
                if (gBoard[i][j].isMarked) {
                    value = '⛳';
                } else {
                    value = '💣';
                }
            } else {
                if (gBoard[i][j].isMarked) {
                    value = '❌';
                }
            }
            gBoard[i][j].isShown = true;
            renderEndOfGame({ i: i, j: j }, value);
        }
    }
}

function renderEndOfGame(loc, value) {
    var cellSelector = '.' + getClassName(loc)
    var elCell = document.querySelector(cellSelector);
    elCell.classList.add('open');
    elCell.innerHTML = value;
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

        var newGboard = copyMat(gBoard);
        gBoardStack.push(newGboard);
        gMinesNumStack.push(gLevel.MINES);

        if (!gBoard[i][j].isMarked) {
            gBoard[i][j].isMarked = true;
            gLevel.MINES--;

            checkVictory();

        } else {
            gBoard[i][j].isMarked = false;
            gLevel.MINES++;
        }

        renderCell({ i: i, j: j }, gBoard[i][j]);
        renderMines(gLevel.MINES);
    }
}

function undo() {
    if (!gGame.isOn) return;

    var board = gBoardStack.pop();
    if (board === undefined) return;

    gBoard = copyMat(board);

    var minesNum = gMinesNumStack.pop();
    gLevel.MINES = minesNum;

    renderMines(minesNum);
    renderBoard(gBoard);
}

function renderCell(location, cell) {
    var value = getValueFromCell(cell);
    var cellSelector = '.' + getClassName(location)
    var elCell = document.querySelector(cellSelector);
    if (cell.isShown) elCell.classList.add('open');
    elCell.innerHTML = value;
}

function getValueFromCell(cell) {
    var value;
    if (!cell.isShown && !cell.isMarked) {
        value = '';
    }
    if (!cell.isShown && cell.isMarked) {
        value = '⛳';
    }
    if (cell.isShown && cell.isMine) {
        value = '💣';
    }
    if (cell.isShown && !cell.isMine) {
        if (cell.minesAroundCount === 0) {
            value = '';
        } else {
            value = cell.minesAroundCount;
        }
    }

    return value;
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
    setMines(i, j);
    setMinesNegsCount();
    startStopwatch();
}

function safeClick() {
    if (!gGame.isOn) return;
    if (gSafeClickCounter <= 0) return;

    markRandomCell();
    gSafeClickCounter--;
    renderSafeClick();
}

function markRandomCell() {
    var isFound = false;
    while (!isFound) {
        var randI = getRandonInt(0, gLevel.SIZE - 1);
        var randJ = getRandonInt(0, gLevel.SIZE - 1);
        if (!gBoard[randI][randJ].isMine && !gBoard[randI][randJ].isShown) {
            var cellSelector = '.' + getClassName({ i: randI, j: randJ });
            var elCell = document.querySelector(cellSelector);
            elCell.classList.add('safeclicked');
            setTimeout(function () {
                elCell.classList.remove('safeclicked');
            }, 1000);
            isFound = true;
        }
    }
}