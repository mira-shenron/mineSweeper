'use strict';

var gBoard;
var gLevel;
var gGame;
var gFirstClick;
var gInterval;
var gGameStartTimestamp;
var gNumOfMines;
var gLives;

function initGame(elBtn, levelName) {
    gGame = resetGame();
    gLives = 3; 
    renderLives(gLives);

    var level = 'beginner';
    if (elBtn !== undefined) {
        level = elBtn.name;
    }
    else if (levelName !== undefined) {
        level = levelName;
    }

    gLevel = initLevel(level);
    gNumOfMines = gLevel.MINES;
    gBoard = buildBoard();


    renderSmiley('😃');
    renderMines(gLevel.MINES);
    renderBoard(gBoard);
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
    elTime.innerText = timePassed.getMinutes() + '.' + timePassed.getSeconds();
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
            if(!board[i][j].isMarked) board[i][j].elemToPrint = '💣';
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
    //console.log(elBoard.innerHTML);
}

function handleOpenCell(cell) {
    var isLost = false;
    
    if (cell.isMine){
        if(gLives === 1){
            cell.isShown = true;
            renderCell({ i: cell.i, j: cell.j }, cell.elemToPrint, cell.isShown);

            var isLost = true;
            gameOver(isLost);
            revealAllMines();
        }else{
            gLives--;
            renderLives(gLives);
            showBombInDiffColorAndClose({ i: cell.i, j: cell.j });
        }
    }else{
        cell.isShown = true;
        renderCell({ i: cell.i, j: cell.j }, cell.elemToPrint, cell.isShown);
        checkVictory();
    }

    //if empty cell open its neighbors
    if (cell.minesAroundCount === 0) {
        openNegs(cell);
    }
}

function renderLives(livesNum){
    var elLives = document.querySelector('.lives span');
    var lives = ''
    for(var i =0 ; i < livesNum; i++){
        lives += '❤️';
    }
    elLives.innerText = lives;
}

function checkVictory(){
    var openCells = 0;
    var markedCells = 0;
    for(var i=0; i < gLevel.SIZE; i++){
        for(var j=0; j < gLevel.SIZE; j++){
            if(gBoard[i][j].isShown){
                openCells++;
            }else if(gBoard[i][j].isMarked){
                markedCells++;
            }
        }
    }

    if(openCells === (gLevel.SIZE*gLevel.SIZE - gNumOfMines) && markedCells === gNumOfMines){
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

                renderCell({i:i, j:j}, gBoard[i][j].elemToPrint, gBoard[i][j].isShown);
                checkVictory();
            }
        }
    }
}

function gameOver(isLost) {
    renderLives(0);
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
                gBoard[i][j].elemToPrint = '💣';
                gBoard[i][j].isMarked = false;

                renderCell({i:i, j:j}, gBoard[i][j].elemToPrint, gBoard[i][j].isShown);
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

        renderCell({ i: i, j: j },gBoard[i][j].elemToPrint,gBoard[i][j].isShown);
        renderMines();
    }
}

function renderCell(location, value, isShown) {
    var cellSelector = '.' + getClassName(location)
    var elCell = document.querySelector(cellSelector);
    if(isShown) elCell.classList.add('open');
    elCell.innerHTML = value;
}

function showBombInDiffColorAndClose(loc){
    var cellSelector = '.' + getClassName(loc)
    var elCell = document.querySelector(cellSelector);
    elCell.classList.add('bomb');

    setTimeout(function(){
        elCell.classList.remove('bomb');
    }, 3000)
}

function handleFirstLeftClick(i, j) {
    gFirstClick = false;
    setMines(gBoard, i, j);
    setMinesNegsCount(gBoard);
    startStopwatch();
}

