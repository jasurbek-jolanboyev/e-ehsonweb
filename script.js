const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");

const app = express();
const PORT = 5000;
const JWT_SECRET = "super_secret_key"; // amalda .env faylda saqlang

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Fake DB
let users = [];
let campaigns = [];
let activities = [];

// 🔑 Ro‘yxatdan o‘tish
app.post("/api/register", async (req, res) => {
  const { fullName, email, password } = req.body;

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: "Bu email allaqachon ro‘yxatdan o‘tgan" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: uuidv4(),
    fullName,
    email,
    password: hashedPassword,
    status: "active",
    role: "user"
  };

  users.push(newUser);

  activities.unshift({
    id: uuidv4(),
    icon: "user-plus",
    message: `${fullName} ro‘yxatdan o‘tdi`,
    timestamp: new Date().toISOString()
  });

  res.json({ message: "Ro‘yxatdan o‘tish muvaffaqiyatli" });
});

// 🔑 Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ message: "Email topilmadi" });

  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) return res.status(400).json({ message: "Parol noto‘g‘ri" });

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });

  activities.unshift({
    id: uuidv4(),
    icon: "sign-in-alt",
    message: `${user.fullName} tizimga kirdi`,
    timestamp: new Date().toISOString()
  });

  res.json({ token, user: { id: user.id, fullName: user.fullName, role: user.role } });
});

// 👥 Barcha userlar (admin uchun)
app.get("/api/users", (req, res) => {
  res.json(users);
});

// 🚫 Userni bloklash
app.post("/api/users/:id/block", (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: "User topilmadi" });

  user.status = user.status === "active" ? "blocked" : "active";

  activities.unshift({
    id: uuidv4(),
    icon: user.status === "blocked" ? "user-lock" : "user-check",
    message: `${user.fullName} ${user.status === "blocked" ? "bloklandi" : "blokdan chiqarildi"}`,
    timestamp: new Date().toISOString()
  });

  res.json({ message: `User ${user.status} qilindi` });
});

// 📢 Kampaniya yaratish
app.post("/api/campaigns", (req, res) => {
  const { title, description, createdBy } = req.body;

  const newCampaign = {
    id: uuidv4(),
    title,
    description,
    status: "pending",
    createdBy
  };

  campaigns.push(newCampaign);

  activities.unshift({
    id: uuidv4(),
    icon: "plus-circle",
    message: `Yangi kampaniya yaratildi: ${title}`,
    timestamp: new Date().toISOString()
  });

  res.json({ message: "Kampaniya yaratildi", campaign: newCampaign });
});

// 📢 Kampaniyani tasdiqlash/rad etish
app.post("/api/campaigns/:id/status", (req, res) => {
  const { status } = req.body;
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ message: "Kampaniya topilmadi" });

  campaign.status = status;

  activities.unshift({
    id: uuidv4(),
    icon: status === "approved" ? "check-circle" : "times-circle",
    message: `Kampaniya "${campaign.title}" ${status === "approved" ? "tasdiqlandi" : "rad etildi"}`,
    timestamp: new Date().toISOString()
  });

  res.json({ message: `Kampaniya ${status} qilindi` });
});

// 📰 Activity feed
app.get("/api/activities", (req, res) => {
  res.json(activities);
});

// 🚀 Serverni ishga tushirish
app.listen(PORT, () => console.log(`Server http://localhost:${PORT} da ishlayapti 🚀`));
