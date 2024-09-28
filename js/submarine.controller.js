'use strict'

const gGameStates = getGameStates()
const gAudioHit = new Audio('./sound/hit.mp3')
const gAudioMiss = new Audio('./sound/miss.mp3')
const gAudioDestroy = new Audio('./sound/destroy.mp3')
const gAudioAmbience = new Audio('./sound/ambience.mp3')

var gIsSoundMuted = false
var gIsAmbienceMuted = false
var gTurnIntervalId
var gGifTimeoutId

gAudioHit.volume = 0.1
gAudioMiss.volume = 0.1
gAudioDestroy.volume = 0.1
gAudioAmbience.volume = 0.050
gAudioAmbience.loop = true

function onInit() {
    createPlayers()
    renderBoard()
    // gAudioAmbience.play()
}

function renderBoard() {
    var strHTML = ''
    const currPlayer = getCurrPlayer()
    const length = currPlayer.hitBoard.length

    for (let i = 0; i < length; i++) {
        strHTML += '<tr>'
        for (let j = 0; j < length; j++) {
            const cell = currPlayer.hitBoard[i][j]

            var className = 'cell'
            var content = ''

            if (cell === gGameStates.HIT) className += ' hit'
            else if (cell === gGameStates.DESTROYED) className += ' hit destroyed'
            else if (cell === gGameStates.MISS) className += ' miss'

            strHTML += `<td id="cell-${i}-${j}" class="${className}" onclick="onCellClicked(this)">${content}</td>`
        }
        strHTML += '</tr>'
    }

    document.querySelector('.current-player').innerHTML = `
    <h1>
        <span style="color: ${currPlayer.color}">${currPlayer.name}</span>'s Turn:
    </h1>`
    document.querySelector('.game-board').innerHTML = strHTML
}

function onCellClicked(elCell) {
    clearInterval(gTurnIntervalId)
    
    const coord = getCellCoord(elCell)
    const elBoard = document.querySelector('.game-board')

    if (!isEmptyCell(coord)) return

    if (isHit(coord)) {
        setCellState(coord, gGameStates.HIT)
        damageShip(coord)
        markDestroyedCells(coord)
        
        elCell.classList.add('hit')
        gAudioHit.currentTime = 0
        gAudioHit.play()

        checkVictory()
    } else {
        setCellState(coord, gGameStates.MISS)
        elCell.classList.add('miss')
        
        gAudioMiss.currentTime = 0
        gAudioMiss.play()
        
        elBoard.classList.add('unclickable')
        gTurnIntervalId = setTimeout(() => {
            elBoard.classList.remove('unclickable')
            setNextTurn()
            renderBoard()
        }, 2000)
    }
}

function isHit(coord) {
    const enemyBoard = getEnemyBoard()
    return enemyBoard[coord.i][coord.j] !== gGameStates.EMPTY
}

function isEmptyCell(coord) {
    const currPlayer = getCurrPlayer()
    return currPlayer.hitBoard[coord.i][coord.j] === gGameStates.EMPTY
}

function isDestroyed(coord) {
    const currPlayer = getCurrPlayer()
    return currPlayer.hitBoard[coord.i][coord.j] === gGameStates.DESTROYED
}

function showShipGIF() {
    clearTimeout(gGifTimeoutId)
    const elRadar = document.querySelector('.radar')
    elRadar.src = `img/ship${getRandomInt(1, 5)}.gif`
    gGifTimeoutId = setTimeout(()=> {
        elRadar.src = 'img/radar.gif'
    }, 7000)
}

function markDestroyedCells(coord) {
    if (!isDestroyed(coord)) return
    const ship = getEnemyShip(coord)

    for (let i = 0; i < ship.coords.length; i++) {
        const currCord = ship.coords[i]
        const elCell = getElCell(currCord)
        elCell.classList.add('destroyed')
        castFlames(elCell)
    }
    
    showShipGIF()
    gAudioDestroy.currentTime = 0
    gAudioDestroy.play()
}

function castFlames(elCell) {
    elCell.classList.add('flame')
    setTimeout(() => {
        elCell.classList.remove('flame')
    }, 1000)
}

function checkVictory() {
    const currPlayer = getCurrPlayer()
    const maxHits = getMaxHits()

    if (currPlayer.hitCount >= maxHits) {
        const elModal = document.querySelector('.modal')
        elModal.innerHTML = `
            <h1><span style="color: ${currPlayer.color}">${currPlayer.name}</span> is victorious!</h1>
            <button onclick="onNewGame()">New Game</button>`
        showModal()
        showBackdrop()
    }
}

function getElCell(pos) {
    return document.getElementById(`cell-${pos.i}-${pos.j}`)
}

function getCellCoord(elCell) {
    const idParts = elCell.id.split('-')
    return {
        i: +idParts[1],
        j: +idParts[2]
    }
}

function onMuteBG() {
    gIsAmbienceMuted = !gIsAmbienceMuted
    gIsAmbienceMuted ? gAudioAmbience.pause() : gAudioAmbience.play()
}

function onMuteSE() {
    gIsSoundMuted = !gIsSoundMuted
    if (gIsSoundMuted) {
        gAudioHit.volume = 0
        gAudioMiss.volume = 0
        gAudioDestroy.volume = 0
    } else {
        gAudioHit.volume = 0.1
        gAudioMiss.volume = 0.1
        gAudioDestroy.volume = 0.1
    }
}

function onNewGame() {
    showBackdrop(false)
    showModal(false)
    onInit()
}