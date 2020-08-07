var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);

// squares of the board
var squares = ["", "", "", "", "", "", "", "", ""];
// current player
var currentPlayer = "X";
// active users
var activeUserCount = 0;
var totalUserCount = 0;
var users = []; // {socketId, userId, role}

// serve static files
app.use(express.static(__dirname));

// assign users
io.on("connection", function (socket) {
  var role;
  // start by assigning user X
  if (!getUserBy("role", "X")) {
    role = "X";
    // second user becomes O
  } else if (!getUserBy("role", "O")) {
    role = "O";
    // later users become spectator
  } else {
    role = "Espectador";
  }
  // push to users
  users.push({
    socketId: socket.id,
    role: role,
    userId: ++totalUserCount,
  });

  // keep track of active user count
  activeUserCount++;

  // send user count to client
  io.emit("activeUserCount", activeUserCount);
  socket.emit("connected", {
    currentPlayer: currentPlayer,
    squares: squares,
    role: role,
  });

  // remove user that disconnects
  socket.on("disconnect", function () {
    removeUserBySocketId(socket.id);
    activeUserCount--;
    io.emit("activeUserCount", activeUserCount);
  });

  // reset grid and current player
  socket.on("reset", function () {
    squares = ["", "", "", "", "", "", "", "", ""];
    currentPlayer = "X";
    io.emit("reset");
  });

  // handle clicking a square serverside
  socket.on("move", function (data) {
    // check against cheating, send data to client
    if (getUserBy("socketId", socket.id).role !== currentPlayer) {
      return;
    }

    // send data to client
    squares[data.squareId] = data.player;
    io.emit("move", data);

    // check winning condition and send to client
    if (checkWinningConditions(currentPlayer)) {
      io.emit("winner", currentPlayer);
      return;
    }

    // change player
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    io.emit("changePlayer", currentPlayer);
  });
});

// get different values from users object
function getUserBy(key, value) {
  for (var i = 0; i < users.length; i++) {
    if (users[i][key] === value) {
      return users[i];
    }
  }
  return null;
}

// remove a user
function removeUserBySocketId(socketId) {
  for (var i = 0; i < users.length; i++) {
    if (users[i].socketId === socketId) {
      users.splice(i, 1);
      return;
    }
  }
}

// listening on port 3000
http.listen(process.env.PORT || 3000, function () {
  console.log("listening on *: 3000");
});

// check for winner with current X or O
function checkWinningConditions(player) {
  var result = false;
  if (
    checkThree(1, 2, 3, player) ||
    checkThree(4, 5, 6, player) ||
    checkThree(7, 8, 9, player) ||
    checkThree(1, 4, 7, player) ||
    checkThree(2, 5, 8, player) ||
    checkThree(3, 6, 9, player) ||
    checkThree(1, 5, 9, player) ||
    checkThree(3, 5, 7, player)
  ) {
    result = true;
  }
  return result;
}

// check three box values for X or O
function checkThree(a, b, c, player) {
  var result = false;

  if (
    getValueInBox(a) == player &&
    getValueInBox(b) == player &&
    getValueInBox(c) == player
  ) {
    result = true;
  }
  return result;
}

// get value from box
function getValueInBox(number) {
  return squares[number - 1];
}
