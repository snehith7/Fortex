const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const MONGO_URI = 'mongodb://127.0.0.1:27017/hackathon_db'; 

app.use(cors());
app.use(express.json());

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error(err));

// --- SCHEMAS ---
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  skills: String
});
const User = mongoose.model('User', UserSchema);

const OpportunitySchema = new mongoose.Schema({
  title: String,
  type: String,
  skillsRequired: [String],
  description: String,
  postedBy: String, 
  deadline: Date, // <--- NEW: Deadline Field
  createdAt: { type: Date, default: Date.now }
});
const Opportunity = mongoose.model('Opportunity', OpportunitySchema);

// --- ROUTES ---

// 1. GET Opportunities (With Auto-Delete for Expired Jobs)
app.get('/api/opportunities', async (req, res) => {
  try {
    // --- AUTO-DELETE LOGIC ---
    // Delete any job where deadline is LESS than (<) Right Now
    await Opportunity.deleteMany({ deadline: { $lt: new Date() } });

    const { skill } = req.query;
    const query = skill ? { skillsRequired: { $regex: skill, $options: 'i' } } : {};
    
    const opportunities = await Opportunity.find(query);
    res.json(opportunities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST Opportunity (With Deadline)
app.post('/api/opportunities', async (req, res) => {
  try {
    const newOpp = new Opportunity({
      title: req.body.title,
      type: req.body.type,
      skillsRequired: req.body.skillsRequired,
      description: req.body.description,
      postedBy: req.body.postedBy,
      deadline: req.body.deadline, // <--- SAVE DEADLINE
      createdAt: new Date()
    });
    await newOpp.save();
    res.json(newOpp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. DELETE Opportunity (User deleting their own post)
app.delete('/api/opportunities/:id', async (req, res) => {
  try {
    await Opportunity.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting" });
  }
});

// 4. GET MY POSTS (For Dashboard)
app.get('/api/my-posts/:email', async (req, res) => {
  try {
    const myPosts = await Opportunity.find({ postedBy: req.params.email });
    res.json(myPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Auth Routes
app.post('/api/register', async (req, res) => {
  /* ... (Keep your existing Register logic here) ... */
    // For brevity, I'm assuming you kept the logic from the previous step.
    // If you need me to paste the full register/login code again, let me know.
    const { name, email, password, skills } = req.body; 
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email exists" });
    const newUser = new User({ name, email, password, skills });
    await newUser.save();
    res.json({ message: "Registered" });
});

app.post('/api/login', async (req, res) => {
  /* ... (Keep your existing Login logic here) ... */
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (user) res.json({ message: "Success", user });
    else res.status(401).json({ error: "Invalid credentials" });
});

app.get('/api/users', async (req, res) => {
    const users = await User.find();
    res.json(users);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));