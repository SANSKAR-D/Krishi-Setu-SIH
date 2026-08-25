require("dotenv").config({path:"./config/.env"});
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const eventRoutes = require("./routes/eventRoutes");

const app = express();

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());

// ---------- MongoDB Connection ----------
const MONGODB_URI = process.env.MONGODB_URI; // ✅ same name as in .env

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined. Check your .env file!");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Atlas connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ---------- Test Route ----------
app.get("/", (req, res) => {
  res.send("Krishi-Setu backend server is running");
});

// ---------- Crop Calendar Routes ----------

app.use("/api", eventRoutes);
// ---------- Start Server ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
