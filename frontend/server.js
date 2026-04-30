const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// NEW: Required modules for tracking WebSockets
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(express.json());
app.use(cors());

// NEW: Setup the HTTP Server and wrap it with Socket.io for Real-Time Tracking
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ["GET", "POST"] }
});

// ─── DATABASE CONNECTION ───
// Replace with your MongoDB Atlas URI if deploying, otherwise use localhost
mongoose.connect('mongodb://127.0.0.1:27017/farm2home', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB Connected')).catch(err => console.log(err));

// ─── DATABASE SCHEMAS & MODELS ───
const User = mongoose.model('User', new mongoose.Schema({
  role: String, // 'farmer', 'consumer', 'driver'
  name: String,
  phone: { type: String, unique: true },
  password: { type: String }, // Made optional to allow consumers to register without it
  loc: String,
  vehicle: String
}));

const Product = mongoose.model('Product', new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  farmerName: String,
  farmerPhone: String,
  loc: String,
  category: String, // 'veg', 'fruit', 'flower'
  name: String,
  price: Number,
  qty: Number,
  min: Number // Used as the Target Quantity for Group Buys
}));

const Job = mongoose.model('Job', new mongoose.Schema({
  orderId: String,
  buyerName: String,
  buyerPhone: String,
  dropLoc: String, // E.g., 'BuyerA (10kg) - Loc A | Buyer B (20kg) - Loc B'
  pickups: [String],
  summary: String,
  deliveryFee: Number,
  status: { type: String, default: 'pending' }, // pending, accepted, completed
  driverPhone: String,
  driverName: String
}));

const GroupBuy = mongoose.model('GroupBuy', new mongoose.Schema({
  gbId: String,
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: String,
  cat: String,
  price: Number,
  targetQty: Number, // The bulk minimum set by the farmer
  farmerName: String,
  farmerLoc: String,
  farmerPhone: String,
  status: { type: String, default: 'open' }, // open, completed
  participants: [{
    name: String,
    phone: String,
    loc: String,
    qty: Number
  }]
}));

// ─── REAL-TIME TRACKING SOCKETS ───
io.on('connection', (socket) => {
  console.log(`🔌 Client Connected: ${socket.id}`);

  // Consumer joins an order tracking room
  socket.on('joinTracking', (orderId) => {
    socket.join(orderId);
    console.log(`🛒 Consumer joined tracking for Order: ${orderId}`);
  });

  // Driver pushes continuous GPS updates
  socket.on('driverLocationUpdate', (data) => {
    // Expected data format: { orderId: '...', lat: 12.9, lng: 77.5, pos: 50 }
    io.to(data.orderId).emit('liveLocation', data);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client Disconnected: ${socket.id}`);
  });
});

// ─── API ROUTES ───

// 1. User Login/Register
app.post('/api/users/login', async (req, res) => {
  const { role, name, phone, loc, vehicle, password } = req.body;
  try {
    let user = await User.findOne({ phone });
    if (user) {
      if (user.password && password && user.password !== password) {
        return res.status(401).json({ error: 'Incorrect password' });
      }
    } else {
      user = new User({ role, name, phone, password, loc, vehicle });
      await user.save();
    }
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Get active farmers
app.get('/api/users/farmers', async (req, res) => {
  const farmers = await User.find({ role: 'farmer' });
  res.json(farmers);
});

// 3. Add a Product
app.post('/api/products', async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.json(product);
});

// 4. Get Products
app.get('/api/products', async (req, res) => {
  const { category } = req.query;
  const query = { qty: { $gt: 0 } };
  if (category && category !== 'all') query.category = category;
  const products = await Product.find(query);
  res.json(products);
});

// 5. Create Order & Delivery Job (Standard Cart)
app.post('/api/jobs', async (req, res) => {
  const { cart, jobData } = req.body;
  for (let item of cart) {
    await Product.findByIdAndUpdate(item._id, { $inc: { qty: -item.orderQty } });
  }
  const job = new Job(jobData);
  await job.save();
  res.json({ success: true, orderId: job.orderId });
});

// 6. Get Logistics Jobs
app.get('/api/jobs', async (req, res) => {
  const { status, driverPhone } = req.query;
  let query = {};
  if (status === 'pending') query.status = 'pending';
  else query = { driverPhone, status: { $in: ['accepted', 'completed'] } };
  const jobs = await Job.find(query).sort({ _id: -1 });
  res.json(jobs);
});

// 7. Update Job Status
app.patch('/api/jobs/:id', async (req, res) => {
  const { status, driverName, driverPhone } = req.body;
  const job = await Job.findOneAndUpdate(
    { orderId: req.params.id },
    { status, driverName, driverPhone },
    { new: true }
  );
  
  // Optionally, trigger a status update to connected tracking rooms
  if(job) {
     io.to(job.orderId).emit('statusUpdate', { status: job.status });
  }

  res.json(job);
});

// ─── GROUP BUY (COMMUNITY BASKET) ROUTES ───

// Get all open group buys
app.get('/api/groupbuys', async (req, res) => {
  const groupBuys = await GroupBuy.find({ status: 'open' });
  res.json(groupBuys);
});

// Join or Create a Group Buy
app.post('/api/groupbuys/pledge', async (req, res) => {
  const { productId, cat, productName, price, targetQty, farmerName, farmerLoc, farmerPhone, user } = req.body;
  
  try {
    let activeGB = await GroupBuy.findOne({ productId, status: 'open' });
    
    if (!activeGB) {
      activeGB = new GroupBuy({
        gbId: 'GB-' + Date.now(),
        productId, cat, productName, price, targetQty, farmerName, farmerLoc, farmerPhone,
        participants: [user]
      });
    } else {
      activeGB.participants.push(user);
    }

    const currentTotal = activeGB.participants.reduce((sum, p) => sum + p.qty, 0);
    
    if (currentTotal >= activeGB.targetQty) {
      activeGB.status = 'completed';
      await Product.findByIdAndUpdate(productId, { $inc: { qty: -currentTotal } });
      
      const drops = activeGB.participants.map(p => `${p.name} (${p.qty}kg) - ${p.loc}`).join(' | ');
      const extraFee = (activeGB.participants.length - 1) * 20;
      
      const job = new Job({
        orderId: 'GBORD-' + Math.floor(1000 + Math.random() * 9000),
        buyerName: 'Community Group Buy',
        buyerPhone: activeGB.participants[0].phone,
        dropLoc: 'Multiple Drops: ' + drops,
        pickups: [farmerLoc],
        summary: `${currentTotal}kg ${productName} (Splitting to ${activeGB.participants.length} buyers)`,
        deliveryFee: 50 + extraFee,
        status: 'pending'
      });
      await job.save();
    }
    
    await activeGB.save();
    res.json({ success: true, groupBuy: activeGB, isComplete: activeGB.status === 'completed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── START SERVER ───
// Use 'server.listen' instead of 'app.listen' to include Socket.io
server.listen(5000, () => console.log('🚀 Farm2Home API & Tracking Sockets running on http://localhost:5000'));