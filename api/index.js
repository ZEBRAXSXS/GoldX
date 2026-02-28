const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI);

const User = mongoose.model('User', new mongoose.Schema({
  wallet: String,
  goldX: { type: Number, default: 0 },
  stakedTON: { type: Number, default: 0 },
  lastClaim: { type: Date, default: Date.now },
  keys: { type: Number, default: 0 }
}));

app.get('/balance/:wallet', async (req, res) => {
  let user = await User.findOne({ wallet: req.params.wallet });
  if (!user) user = await new User({ wallet: req.params.wallet }).save();
  res.json(user);
});

app.post('/stake', async (req, res) => {
  const { wallet, amount } = req.body;
  let user = await User.findOne({ wallet });
  user.stakedTON += parseFloat(amount);
  user.lastClaim = new Date();
  await user.save();
  res.json(user);
});

app.post('/claim', async (req, res) => {
  const { wallet } = req.body;
  const user = await User.findOne({ wallet });
  const days = (Date.now() - user.lastClaim) / 86400000;
  const reward = (user.stakedTON / 1000) * days;
  user.goldX += reward;
  user.lastClaim = new Date();
  await user.save();
  res.json({ reward, user });
});

module.exports.handler = serverless(app);
