// server/index.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const drawingHistory = [];
let undoneHistory = [];

io.on("connection", (socket) => {
  console.log("Client connected");

  // Send the current drawing history to the new client
  socket.emit("drawingHistory", drawingHistory);

  socket.on("draw", (points) => {
    drawingHistory.push(points);
    socket.broadcast.emit("draw", points);
  });

  socket.on("requestHistory", () => {
    socket.emit("drawingHistory", drawingHistory);
  });

  socket.on("undo", (index) => {
    console.log("index", index);
    // if (index >= 0 && index < drawingHistory.length) {
    console.log("undoing");
    const undoneDrawing = drawingHistory.splice(index + 1);
    undoneHistory.push(...undoneDrawing);
    io.emit("drawingHistory", drawingHistory);
    // }
  });

  socket.on("redo", () => {
    if (undoneHistory.length > 0) {
      console.log("redoing");

      const redoneDrawing = undoneHistory.pop();
      drawingHistory.push(redoneDrawing);
      io.emit("drawingHistory", drawingHistory);
    }
  });

  socket.on("clear", () => {
    if (drawingHistory.length > 0) {
      drawingHistory.length = 0;
      io.emit("clear");
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Ensure the drawings directory exists
const drawingsDir = path.join(__dirname, "drawings");
if (!fs.existsSync(drawingsDir)) {
  fs.mkdirSync(drawingsDir);
}

// Save drawing endpoint
app.post("/save", (req, res) => {
  const { name, drawing } = req.body;
  fs.writeFileSync(
    path.join(drawingsDir, `${name}.json`),
    JSON.stringify(drawing)
  );
  res.status(200).send("Drawing saved");
});

// Load drawing endpoint
app.get("/load/:name", (req, res) => {
  const { name } = req.params;
  const filePath = path.join(drawingsDir, `${name}.json`);
  if (fs.existsSync(filePath)) {
    const drawing = JSON.parse(fs.readFileSync(filePath));
    res.status(200).json(drawing);
  } else {
    res.status(404).send("Drawing not found");
  }
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
