import fs from 'fs';
import jwt from 'jsonwebtoken';

const BLACKLIST_FILE = 'jwtBlacklist.json';

// Load the blacklist from the JSON file.
let blacklist = {};

try {
    blacklist = JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf8'));
} catch (err) {
    // Handle errors such as file not found.
    console.error('Error reading blacklist:', err);
}

// Function to check if a JWT is blacklisted.
function isBlacklisted(userId, jwToken) {
    if (blacklist[userId] && blacklist[userId].includes(jwToken)) {
        return true;
    }
    return false;
}

// Function to save the blacklist back to the JSON file.
function saveBlacklist() {
    fs.writeFileSync(
        BLACKLIST_FILE,
        JSON.stringify(blacklist, null, 2),
        'utf8',
    );
}

// Function to add a JWT to the blacklist for a specific user.
function addToBlacklist(userId, jwToken) {
    if (!blacklist[userId]) {
        blacklist[userId] = [];
    }
    blacklist[userId].push(jwToken);
    saveBlacklist();
}

// Clean the blacklist by removing expired tokens
function cleanBlacklist() {
    const now = Date.now();
    blacklist.blacklist = blacklist.blacklist.filter((token) => {
        const decoded = jwt.decode(token);
        return decoded.exp * 1000 > now; // Check if token is not expired
    });
    fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(blacklist));
    console.log('Blacklist cleaned.');
}

export { addToBlacklist, isBlacklisted, cleanBlacklist };
