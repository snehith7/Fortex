const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer'); // Import here

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
  skills: String,
  profileViews: { type: Number, default: 0 },
  appsSent: { type: Number, default: 0 }
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

// --- EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'snehithsudulaguntla2108@gmail.com', 
        pass: 'cozs gzqm nuoq qqrx'    
    }
});

let verificationCodes = {};

// --- ROUTES ---

// 1. GET ALL OPPORTUNITIES
app.get('/api/opportunities', async (req, res) => {
  try {
    await Opportunity.deleteMany({ deadline: { $lt: new Date() } });
    const opportunities = await Opportunity.find();
    res.json(opportunities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET MY POSTS
app.get('/api/my-posts/:email', async (req, res) => {
  try {
    const userEmail = req.params.email;
    await Opportunity.deleteMany({ deadline: { $lt: new Date() } });
    const myPosts = await Opportunity.find({ postedBy: userEmail });
    res.json(myPosts);
  } catch (err) {
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

// --- AUTH & USER ROUTES ---

// REGISTER
app.post('/api/register', async (req, res) => {
    const { name, email, password, skills } = req.body; 
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email exists" });
    
    const newUser = new User({ name, email, password, skills, profileViews: 0, appsSent: 0 });
    await newUser.save();
    res.json({ message: "Registered" });
});

// LOGIN
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (user) res.json({ message: "Success", user });
    else res.status(401).json({ error: "Invalid credentials" });
});

// GET SINGLE USER (For Dashboard)
app.get('/api/user/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if(user) res.json(user);
        else res.status(404).json({error: "User not found"});
    } catch(err) {
        res.status(500).json({error: err.message});
    }
});

// UPDATE STATS
app.post('/api/user/stats', async (req, res) => {
    try {
        const { email, type } = req.body; 
        const updateField = type === 'view' ? { profileViews: 1 } : { appsSent: 1 };
        const updatedUser = await User.findOneAndUpdate(
            { email: email },
            { $inc: updateField }, 
            { new: true }
        );
        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SEND CODE
app.post('/api/send-code', async (req, res) => {
    const { email } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes[email] = code;

    const mailOptions = {
        from: 'OpportunityHub <no-reply@opportunityhub.com>',
        to: email,
        subject: 'Your Verification Code',
        text: `Your OpportunityHub verification code is: ${code}`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Code ${code} sent to ${email}`);
        res.json({ message: "Code sent" });
    } catch (error) {
        console.error("❌ Email Error:", error);
        res.status(500).json({ error: "Failed to send email" });
    }
});

// VERIFY CODE
app.post('/api/verify-code', (req, res) => {
    const { email, code } = req.body;
    if (verificationCodes[email] === code) {
        delete verificationCodes[email]; 
        res.json({ success: true });
    } else {
        res.status(400).json({ error: "Invalid code" });
    }
});

// --- ADMIN ROUTES ---

// ⚠️ THIS WAS MISSING: GET ALL USERS
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// DELETE USER & THEIR POSTS
app.delete('/api/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const userToDelete = await User.findById(userId);
        if (!userToDelete) return res.status(404).json({ error: "User not found" });

        await Opportunity.deleteMany({ postedBy: userToDelete.email });
        await User.findByIdAndDelete(userId);

        console.log(`🗑️ Deleted user ${userToDelete.email}`);
        res.json({ message: "Account deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));