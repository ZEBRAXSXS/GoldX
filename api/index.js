const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Схема пользователя (пример: TON адрес, баланс)
const UserSchema = new mongoose.Schema({
  tonAddress: String,
  balance: { type: Number, default: 0 },
  goldBalance: { type: Number, default: 0 }
});
const User = mongoose.model("User", UserSchema);

// Эндпоинт: Получить/создать пользователя
app.get("/api/user/:address", async (req, res) => {
  let user = await User.findOne({ tonAddress: req.params.address });
  if (!user) {
    user = new User({ tonAddress: req.params.address });
    await user.save();
  }
  res.json(user);
});

// Эндпоинт: Обновить баланс (пример для стейкинга)
app.post("/api/stake", async (req, res) => {
  const { address, amount } = req.body;
  const user = await User.findOne({ tonAddress: address });
  if (user) {
    user.goldBalance += amount;  // Логика стейкинга
    await user.save();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

module.exports = app;
