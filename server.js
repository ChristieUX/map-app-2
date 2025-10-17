import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const pinsFile = path.join(__dirname, "pins.json");
if (!fs.existsSync(pinsFile)) fs.writeFileSync(pinsFile, "[]", "utf-8");

function loadPins() {
  return JSON.parse(fs.readFileSync(pinsFile, "utf-8"));
}

function savePins(pins) {
  fs.writeFileSync(pinsFile, JSON.stringify(pins, null, 2));
}

app.get("/api/pins", (req, res) => res.json(loadPins()));

app.post("/api/pins", (req, res) => {
  const { name, lat, lon } = req.body;
  if (!name || !lat || !lon) return res.status(400).json({ error: "Invalid" });

  const pins = loadPins();
  const newPin = { name, lat, lon };
  pins.push(newPin);
  savePins(pins);

  io.emit("newPin", newPin);
  res.json({ success: true });
});

io.on("connection", socket => {
  console.log("Client connected");
  socket.on("disconnect", () => console.log("Client disconnected"));
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
