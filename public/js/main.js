const socket = io.connect()
const username = $('#theUsername').attr('name')

if (username.length > 16) {
    $('header h5 span').css('font-size', '13px')
}
else if (username.length > 12) {
    $('header h5 span').css('font-size', '15.75px')
}

$('section#game').hide()

$('#joinRoom').css('width', $('#createRoom').css('width'))

function addElement(parentId, elementTag, elementId, html) {
    const parent = document.getElementById(parentId)
    const newElement = document.createElement(elementTag)
    newElement.setAttribute('id', elementId)
    newElement.innerHTML = html
    parent.appendChild(newElement)
}

function removeElement(elementId) {
    const element = document.getElementById(elementId)
    element.parentNode.removeChild(element)
}

function createTheRoom(name, players) {
    addElement('rooms', 'div', 'div'+name, '')
    addElement('div'+name, 'input', 'title'+name, name)
    addElement('div'+name, 'h5', 'players'+name, players)
    addElement(`div${name}`, 'button', `join${name}`, 'Join')

    const div = $(`#div${name}`)
    const input = $(`#title${name}`)
    const h = $(`#players${name}`)
    const button = $(`#join${name}`)

    div.css('border', '2px solid #00eaff')
    div.css('background-color', $('#logout').css('background-color'))

    input.css('background-color', $('#createRoom').css('background-color'))
    input.css('width', 'auto')
    input.css('border', 'none')
    input.prop('disabled', true)
    input.val(name)
    input.css('color', 'white')
    input.css('font-size', '20px')

    h.html('Players: '+h.html())
    h.css('margin', 'auto')
    
    button.addClass('btn btn-success')
    button.css('height', input.css('height'))
}

let roomName = ''

$('#createRoomSuccess').click(() => {
    roomName = $('#createRoomModal_input').val()
    if (roomName != '' && roomName != null) {
        $('#createRoomModal').modal('hide')
        socket.emit('createRoomRequest', roomName)
    }
})

$('#createRoomModal_input').keypress(e => {
    if (e.which == 13) {
        $('#createRoomSuccess').click()
    }
})

$('#createRoom').click(() => {
    $('#createRoomModal').modal('show')
    $('#createRoomModal_input').val('')
    $('#createRoomModal_input').focus()
})

socket.on('illegalRoomName', () => {
    alert('Room name can only contain letters and numbers.')
})

socket.emit('newJoin', username)

// displayings:
socket.on('displayPlayers', players => {
    $('#online').html('')
    players.forEach(player => {
        const newHtml = `<span id="span${player.name}">${player.name} is ${player.status}.</span><br>`
        $('#online').html($('#online').html() + newHtml)
        $('#span'+player.name).css('font-size', player.fontSize)
    })
})

socket.on('displayRooms', rooms => {
    $('div#rooms').empty()
    rooms.forEach(room => {
        createTheRoom(room.name, room.players)
    })
})
// :displayings

$('main').click(e => {
    if (e.target.id.substring(0, 4) == 'join' && e.target.id != 'joinRoom') {
        const id = e.target.id
        const roomName = id.substring(4, id.length)
        socket.emit('joinRoomRequest', roomName, username)
    }
})

let roomJoined = ''

socket.on('joinApproved', roomName => {
    $('main').slideUp(500)
    $('section#game').delay(500).slideDown(500)
    $('section#main').hide()
    roomJoined = roomName
})

$('#game').click(() => {
    $('button#startGame').slideUp(500)
    $('section#main').delay(500).slideDown(500)
})

$('#joinRoom').click(() => {
    socket.emit('logEverything')
})