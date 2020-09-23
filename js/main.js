'use strict';

var gBoard;
var gLevel;
var gGame;
var gFirstClick;
var gInterval;
var gGameStartTimestamp;

function initGame(elBtn, levelName) {
    gGame = resetGame();

    var level = 'beginner';
    if (elBtn !== undefined) {
        levelName = elBtn.name;
    }
    else if (levelName !== undefined) {
        level = levelName;
    }

    gLevel = initLevel(levelName);
    gBoard = buildBoard();

    renderSmiley('😃');
    renderMines();
    renderBoard(gBoard);
}

function restartLevel(){
    initGame(undefined,gLevel.name);
}

function renderMines() {
    var elMinesNum = document.querySelector('.mines span');
    elMinesNum.innerText = gLevel.MINES;
}

function resetGameTime() {
    var elSec = document.querySelector('.timer span');
    elSec.innerText = '0.0';
}

function startStopwatch() {
    gGameStartTimestamp = new Date();
    gInterval = setInterval(printGameTime, 1);
}

function printGameTime() {
    var elTime = document.querySelector('.timer span');
    var currTime = new Date();
    var timePassed = new Date(currTime - gGameStartTimestamp);
    elTime.innerText = timePassed.getSeconds() + '.' + timePassed.getMilliseconds();
}

function resetGame() {
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
            //var isMark = false;
            // if(gBoard !== undefined){
            //     isMark = gBoard[i][j].isMark;
            // }
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

    setMines(board, iFirst, jFirst);
    setMinesNegsCount(board);

    return board;
}

function setMinesNegsCount(board) {
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = board[i][j];
            var numOfMines = countMinesNegs(cell, board);
            cell.minesAroundCount = numOfMines;
            if (!cell.isMine) {
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

            var neg = board[i][j];
            if (neg.isMine) count++;
        }
    }
    return count;
}

function setMines(board, iFirst, jFirst) {
    var minesCounter = 0;
    while (minesCounter < gLevel.MINES) {
        var i = getRandonInt(0, gLevel.SIZE - 1);
        var j = getRandonInt(0, gLevel.SIZE - 1);
        if (!board[i][j].isMine && i !== iFirst && j !== jFirst) {
            board[i][j].isMine = true;
            minesCounter++;
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
            var cellClass = getClassName({ i: i, j: j })

            strHTML += `\t<td class="cell ${cellClass} "  onmousedown="cellClicked(this, ${i}, ${j}, event)">\n`;
            if (currCell.isShown || currCell.isMarked) {
                strHTML += getElemToPrint(currCell);
            }
            strHTML += '\t</td>\n';
        }
        strHTML += '</tr>\n';
    }
    elBoard.innerHTML = strHTML;
    //console.log(elBoard.innerHTML);
}

function getElemToPrint(cell) {
    if (cell.isMarked) {
        return '⛳';
    } else if (cell.isMine) {
        return '💣';
    } else {
        if (cell.minesAroundCount === 0) {
            return '0'; //temp, remove after fixing background
        } else {
            return cell.minesAroundCount;
        }
    }
}

// function restartLevel() {
//     initGame(gLevel.name);
// }

function handleOpenCell(cell) {
    if (cell.isMine) {
        var isLost = true;
        gameOver(isLost);
        revealAllMines();
    }

    //if empty cell open its neighbors
    if (cell.minesAroundCount === 0) {
        openNegs(cell);
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
            if(!gBoard[i][j].isMark){
                console.log(gBoard[1][1]);
                gBoard[i][j].isShown = true;
            } 
        }
    }
    renderBoard(gBoard);
}

function gameOver(isLost) {
    clearInterval(gInterval);
    gGame.isOn = false;

    if (isLost) {
        renderSmiley('🤯');
    } else {
        renderSmiley('😎');
    }
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
                gBoard[i][j].isMark = false;
            }
        }
    }

    renderBoard(gBoard);
}


function cellClicked(elCell, i, j, ev) {
    const LEFT_CLICK = 1;
    const RIGHT_CLICK = 3;

    if (!gGame.isOn) {
        return;
    }

    if (ev.which === LEFT_CLICK) {
        if (gFirstClick) {
            handleFirstLeftClick(i, j);
        }

        if (gBoard[i][j].isShown) return;
        if (!gBoard[i][j].isMarked) {
            gBoard[i][j].isShown = true;
            handleOpenCell(gBoard[i][j]);

            elCell.classList.add('cell'); //check why not works
        }
    }

    if (ev.which === RIGHT_CLICK) {
        if (gBoard[i][j].isShown) return;

        if (!gBoard[i][j].isMarked) {
            gBoard[i][j].isMarked = true;
            console.log(gBoard[i][j]);
            gLevel.MINES--;
        } else {
            gBoard[i][j].isMarked = false;
            console.log(gBoard[i][j]);
            gLevel.MINES++;
        }
        renderMines();
    }

    renderBoard(gBoard);
}

function handleFirstLeftClick(i, j) {
    gFirstClick = false;
    gBoard = buildBoard(i, j);
    renderMines();
    renderBoard(gBoard);
    startStopwatch();
}

