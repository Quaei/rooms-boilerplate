const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const socket = require('socket.io')

const PORT = process.env.PORT || 3000;
const app = express();

// Passport config
require('./config/passport')(passport);

// DB Config
const db = require('./config/keys').MongoURI;

// Connect to Mongo
mongoose.connect(db, {
        useNewUrlParser: true
    })
    .then(function () {
        console.log('MongoDB Connected...')
    })
    .catch(function (err) {
        console.log(err)
    });

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

// Bodyparser
app.use(express.urlencoded({
    extended: false
}));

// Express Session
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global vars
app.use(function (req, res, next) {
    res.locals.successMsg = req.flash('successMsg');
    res.locals.errorMsg = req.flash('errorMsg');
    res.locals.error = req.flash('error');
    next();
});

// Routes - (req, res) = request, response!
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use(express.static('public'))

const server = app.listen(PORT, function () {
    console.log(`Server on started on port ${PORT}`);
});

const io = socket(server)

let players = [] //name, status
let sockets = [] //the socket
let rooms = [] // name, players, gameStarted
io.on('connection', socket => {
    socket.on('newJoin', name => {
        const newPlayer = {
            name: name,
            roomJoined: '',
            status: 'online', // later add colors
            fontSize: (name.length < 12) ? '18.75px' : (name.length < 16) ? '15px' : '14px'
        }
        players.push(newPlayer)
        sockets.push(socket)
        io.emit('displayPlayers', players)
        sockets[players.map(e => e.name).indexOf(name)].emit('displayRooms', rooms)
    })

    socket.on('disconnect', () => {
        const idx = sockets.indexOf(socket)

        if (players.length > 0) {
            if (players[idx].roomJoined != '') {
                const roomIdx = rooms.map(e => e.name).indexOf(players[idx].roomJoined)
                rooms[roomIdx].players--
                const roomPlayerIdx = rooms[roomIdx].playersArr.indexOf(players[idx].name)
                rooms[roomIdx].playersArr.splice(roomPlayerIdx, 1)
                io.emit('displayRooms', rooms)
            }
        }

        players.splice(idx, 1)
        sockets.splice(idx, 1)
        io.emit('displayPlayers', players)
    })

    socket.on('joinRoomRequest', (roomName, name) => {
        if (!roomName.gameStarted) {
            const idx = players.map(e => e.name).indexOf(name)
            const roomIdx = rooms.map(e => e.name).indexOf(roomName)
            sockets[idx].emit('joinApproved', roomName)
            rooms[roomIdx].players++
            rooms[roomIdx].playersArr.push(name)
            players[idx].roomJoined = roomName

            sockets[idx].join(roomName)
            io.emit('displayRooms', rooms)
        }
    })

    socket.on('createRoomRequest', roomName => {
        let exists = false
        rooms.forEach(room => {
            if (room.name == roomName) exists = true
        })
        if (/^[A-za-z0-9]+$/.test(roomName) && !exists) {
            const newRoom = {
                name: roomName,
                players: 0,
                playersArr: [],
                gameStarted: false
            }

            rooms.push(newRoom)
            io.emit('displayRooms', rooms)
        } else {
            if (!exists) sockets[sockets.indexOf(socket)].emit('illegalRoomName')
            else sockets[sockets.indexOf(socket)].emit('roomExists', roomName)
        }
    })

    

    socket.on('logEverything', () => {
        console.log('NEW:')
        console.log(players)
        console.log()
        console.log(rooms)
        console.log()
    })
})
