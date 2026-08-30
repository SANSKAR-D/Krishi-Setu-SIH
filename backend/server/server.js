const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const eventRoutes = require("./routes/eventRoutes");
const chatRoutes = require("./routes/chatRoutes"); 
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());

// ---------- MongoDB Connection ----------
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI || MONGODB_URI === "your_mongodb_uri_here") {
  console.warn("⚠️ MONGODB_URI is not properly defined. Some features (e.g. Crop Calendar) will not work.");
} else {
  mongoose
    .connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB Atlas connected successfully"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));
}

// ---------- Test Route ----------
app.get("/", (req, res) => {
  res.send("Krishi-Setu backend server is running");
});

// ---------- Routes ----------
app.use("/api", eventRoutes);
app.use("/api", chatRoutes); 
app.use("/api", dashboardRoutes);

// ---------- Start Server ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
