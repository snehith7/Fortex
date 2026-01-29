const mongoose = require('mongoose');

// 1. Hardcoded DB Link (Matches your server)
const MONGO_URI = 'mongodb://127.0.0.1:27017/hackathon_db';

// 2. Define the Schema (Same as server.js)
const OpportunitySchema = new mongoose.Schema({
  title: String,
  type: String,
  skillsRequired: [String],
  description: String,
  createdAt: { type: Date, default: Date.now }
});
const Opportunity = mongoose.model('Opportunity', OpportunitySchema);

// 3. The Data to Insert
const sampleEvents = [
  { 
    title: "MERN Stack Bootcamp", 
    type: "Workshop", 
    skillsRequired: ["React", "Node", "MongoDB"], 
    description: "Learn full stack development in 2 days." 
  },
  { 
    title: "Frontend Intern @ Google", 
    type: "Internship", 
    skillsRequired: ["React", "CSS", "Design"], 
    description: "Build beautiful interfaces for billions of users." 
  },
  { 
    title: "AI Research Fellow", 
    type: "Job", 
    skillsRequired: ["Python", "TensorFlow"], 
    description: "Work on large language models." 
  },
  { 
    title: "Data Science Hackathon", 
    type: "Hackathon", 
    skillsRequired: ["Python", "SQL", "Pandas"], 
    description: "Solve real world data problems." 
  },
  { 
    title: "Cloud Architect", 
    type: "Job", 
    skillsRequired: ["AWS", "Java"], 
    description: "Design scalable cloud infrastructure." 
  },
  { 
    title: "UI/UX Designer", 
    type: "Internship", 
    skillsRequired: ["Figma", "Design"], 
    description: "Create user flows and wireframes." 
  }
];

// 4. Run the Insert
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('🌱 Connected to DB...');
    
    // Clear old data first
    await Opportunity.deleteMany({});
    console.log('🧹 Old data cleared.');
    
    // Add new data
    await Opportunity.insertMany(sampleEvents);
    console.log('✅ Added 6 new events!');
    
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });