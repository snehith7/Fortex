// script.js
const API_URL = 'http://localhost:5000/api/opportunities';
const userSkills = ['React', 'Node', 'Python']; // Mock User Skills

// Global variable to hold the list of events
let allEvents = []; 

// 1. Fetch and Display Data
async function fetchOpportunities(query = '') {
    const grid = document.getElementById('opp-grid');
    grid.innerHTML = '<p>Loading...</p>';

    try {
        const url = query ? `${API_URL}?skill=${query}` : API_URL;
        const res = await fetch(url);
        
        // SAVE DATA TO GLOBAL VARIABLE
        allEvents = await res.json(); 

        if (allEvents.length === 0) {
            grid.innerHTML = '<p>No opportunities found.</p>';
            return;
        }

        grid.innerHTML = ''; // Clear loading text
        
        // Loop through events
        allEvents.forEach((event, index) => {
            const matchScore = calculateMatch(event.skillsRequired);
            
            // IMPORTANT: The button calls viewDetails(index)
            // We pass the 'index' (0, 1, 2...) so we know WHICH event was clicked
            const card = `
                <div class="card">
                    <span class="type">${event.type}</span>
                    ${matchScore > 0 ? `<span class="badge">⚡ ${matchScore}% Match</span>` : ''}
                    <h3>${event.title}</h3>
                    <p style="color:#666; font-size:0.9rem;">${event.description ? event.description.substring(0, 60) + '...' : 'No description.'}</p>
                    
                    <div class="tags">
                        ${event.skillsRequired.slice(0, 3).map(s => `<span class="tag">${s}</span>`).join('')}
                    </div>

                    <div style="margin-top: 15px; font-size: 0.85rem; color: #888; border-top: 1px solid #eee; padding-top: 10px;">
                        <span>📍 Remote</span> • <span>💰 Paid</span>
                    </div>

                    <button class="apply-btn" onclick="viewDetails(${index})">View Details</button>
                </div>
            `;
            grid.innerHTML += card;
        });

    } catch (err) {
        console.error(err);
        grid.innerHTML = '<p style="color:red">Error connecting to server.</p>';
    }
}

// 2. THE LINKING LOGIC
window.viewDetails = function(index) {
    // A. Get the event data using the index
    const selectedEvent = allEvents[index];

    // B. Save it to "localStorage" so details.html can read it
    localStorage.setItem('currentEvent', JSON.stringify(selectedEvent));

    // C. Go to the details page
    window.location.href = 'details.html';
};

// 3. Helper: Calculate Match Score
function calculateMatch(eventSkills) {
    if (!eventSkills) return 0;
    const matches = eventSkills.filter(skill => userSkills.includes(skill));
    return Math.round((matches.length / eventSkills.length) * 100);
}

// 4. Setup Search Listener
document.getElementById('search-btn').addEventListener('click', () => {
    const query = document.getElementById('search-input').value;
    fetchOpportunities(query);
});

// Load all on start
fetchOpportunities();