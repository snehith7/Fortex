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
  deadline: Date, 
  createdAt: { type: Date, default: Date.now }
});
const Opportunity = mongoose.model('Opportunity', OpportunitySchema);

// --- ROUTES ---

// 1. GET ALL OPPORTUNITIES (For Dashboard Recommendations)
// Includes Auto-Delete Logic
app.get('/api/opportunities', async (req, res) => {
  try {
    // Auto-Delete Expired Jobs
    await Opportunity.deleteMany({ deadline: { $lt: new Date() } });

    const opportunities = await Opportunity.find();
    res.json(opportunities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET MY POSTS (For "Manage My Posts" Section)
// Includes Auto-Delete Logic & Debugging
app.get('/api/my-posts/:email', async (req, res) => {
  try {
    const userEmail = req.params.email;
    console.log(`🔍 Checking posts for: ${userEmail}`);

    // Auto-Delete here too, just in case
    const deleteResult = await Opportunity.deleteMany({ deadline: { $lt: new Date() } });
    if (deleteResult.deletedCount > 0) {
        console.log(`🗑️ Auto-Deleted ${deleteResult.deletedCount} expired jobs.`);
    }

    const myPosts = await Opportunity.find({ postedBy: userEmail });
    console.log(`✅ Found ${myPosts.length} posts.`);
    res.json(myPosts);

  } catch (err) {
    console.error("❌ Error fetching posts:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3. POST OPPORTUNITY
app.post('/api/opportunities', async (req, res) => {
  try {
    const newOpp = new Opportunity({
      title: req.body.title,
      type: req.body.type,
      skillsRequired: req.body.skillsRequired,
      description: req.body.description,
      postedBy: req.body.postedBy,
      deadline: req.body.deadline,
      createdAt: new Date()
    });
    await newOpp.save();
    console.log("✅ New Job Posted by:", req.body.postedBy);
    res.json(newOpp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. DELETE OPPORTUNITY
app.delete('/api/opportunities/:id', async (req, res) => {
  try {
    await Opportunity.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting" });
  }
});

// --- AUTH ROUTES ---
app.post('/api/register', async (req, res) => {
    const { name, email, password, skills } = req.body; 
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email exists" });
    const newUser = new User({ name, email, password, skills });
    await newUser.save();
    res.json({ message: "Registered" });
});

app.post('/api/login', async (req, res) => {
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