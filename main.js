var socket = io();
var currentPlayer = null;
var activeUserCount = 0;
var gameActive = false;

// set player,board, info text and role from server values
socket.on("connected", function (data) {
  currentPlayer = data.currentPlayer;
  for (var i = 0; i < data.squares.length; i++) {
    setSquare(i, data.squares[i]);
  }
  if (currentPlayer) {
    setText(`Es el turno del Jugador ${currentPlayer}`);
  }
  document.getElementById("role").textContent = `Eres el Jugador ${data.role}`;
});

// reset, check active state and update text
socket.on("reset", function (data) {
  if (activeUserCount > 1) {
    gameActive = true;
  }
  currentPlayer = "X";
  for (var i = 0; i < 9; i++) {
    setSquare(i, "");
  }
  setText(currentPlayer + " Comienza.");
});

// update state
socket.on("state", function (state) {
  for (var i = 0; i < 9; i++) {
    setSquare(i, state[i]);
  }
});

// update game state and text based on user count
socket.on("activeUserCount", function (newActiveUserCount) {
  activeUserCount = newActiveUserCount;
  var msg;
  if (activeUserCount < 2) {
    gameActive = false;
    msg = `Esperando por todos los jugadores para empezar. Solo hay ${activeUserCount} usuarios en linea.`;
  } else {
    gameActive = true;
    msg = `Hay ${activeUserCount} usuarios en linea.`;
  }
  document.getElementById("activeUserCount").textContent = msg;
});

// update square based on move
socket.on("move", function (data) {
  setSquare(data.squareId, data.player);
});

// change currentPlayer and update player text
socket.on("changePlayer", function (newCurrentPlayer) {
  currentPlayer = newCurrentPlayer;
  setText(`Es el turno del jugador ${currentPlayer}`);
});

// declare winner
socket.on("winner", function (winner) {
  gameActive = false;
  setText(`Felicitaciones ${winner}, has ganado!`);
});

// set text
function setText(text) {
  document.getElementById("message").textContent = text;
}

// set square by index and value
function setSquare(index, value) {
  document.getElementById(index).textContent = value;
}

function move(event) {
  // check if game is active
  if (!gameActive) return;

  var square = event.target;
  // check if square is empty
  if (square.textContent === "") {
    // send currentPlayer and squareId to server
    socket.emit("move", {
      player: currentPlayer,
      squareId: square.id,
    });
  }
}

// add event listener to squares
var squares = document.getElementsByClassName("square");
for (var i = 0; i < squares.length; i++) {
  squares[i].addEventListener("click", move);
}

// add event listener for reset button
document.getElementById("reset").addEventListener("click", function () {
  socket.emit("reset");
});
