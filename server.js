import express from "express";
import axios from "axios";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 8080;

// IMPORTANT: set this in Render (or paste it here temporarily)
const BLOB_URL = process.env.BLOB_URL || "https://jsonblob.com/1428758955286519808";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function loadPins() {
  try {
    const res = await axios.get(BLOB_URL, { headers: { "Accept": "application/json" } });
    // JSONBlob returns the raw array you stored
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("Load pins failed:", err?.response?.status, err?.response?.data || err.message);
    return [];
  }
}

async function savePins(pins) {
  try {
    await axios.put(BLOB_URL, pins, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Save pins failed:", err?.response?.status, err?.response?.data || err.message);
  }
}

// API
app.get("/api/pins", async (req, res) => {
  const pins = await loadPins();
  res.json(pins);
});

app.post("/api/pins", async (req, res) => {
  const { name, lat, lon } = req.body || {};
  if (!name || typeof lat !== "number" || typeof lon !== "number") {
    return res.status(400).json({ error: "Invalid data" });
  }

  const pins = await loadPins();
  const newPin = { name, lat, lon, t: Date.now() };
  pins.push(newPin);
  await savePins(pins);

  io.emit("newPin", newPin);
  res.json({ success: true });
});

io.on("connection", () => { /* no-op */ });

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
