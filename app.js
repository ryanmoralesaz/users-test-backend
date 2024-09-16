// Required modules
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();
const mongoose = require('mongoose');
// connect to mongoose
mongoose.connect(process.env.MONGODB_URI, {
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('connected to MongoDb');
});
const User = require('./models/User');
// Initialize Express application
const app = express();
const upload = multer();
// Define paths
const publicPath = path.join(__dirname, 'public');
const dataPath = path.join(__dirname, 'data', 'users.json');
// console.log(publicPath);
// Middleware setup
app.use(cors(
    {
        origin: 'http://localhost:5000',
        optionsSuccessStatus: 200,
    }
)); // Invoke cors as a function

app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json()); // Parse JSON bodies

// Routes

// Home route
app.get('/', (req, res) => {
    // res.sendFile('index.html', { root: clientPath });
    console.log('home endpoint hit');
    res.status(200).end('hello world');
});

app.get('/users', async (req, res) => {
    try {
        // const data = await fs.readFile(dataPath, 'utf8');
        const users = await User.find({})
        // if (data) {
        //     const users = JSON.parse(data);
        if (users) {
            res.status(200).json(users);
        } else {
            throw new Error("Error no users available");
        }
        // } else {
        //     throw new Error("error reading json file");
        // }
    } catch (error) {
        console.error("Problem getting users" + error.message);
        res.status(500).json({ error: "Problem reading users" });
    }
});

// Form route
app.get('/form', (req, res) => {
    console.log('form endpoint hit');
    res.setHeader('Content-Type', 'text/html');
    res.sendFile('pages/form.html', { root: publicPath });
});

// Form submission route
app.post('/submit-user', async (req, res) => {
    try {
        console.log('submit user hit');
        console.log(req.body);
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                error: 'Missing required fields'
            })
        }
        // Read existing users from file
        // let users = [];
        let user = await User.findOne({ name, email });
        // try {
        //     const data = await fs.readFile(dataPath, 'utf8');
        //     users = JSON.parse(data);
        // } catch (error) {
        //     // If file doesn't exist or is empty, start with an empty array
        //     console.error('Error reading user data:', error);
        //     users = [];
        // }

        // // Find or create user
        // let user = users.find(u => u.name === name && u.email === email);
        if (user) {
            user.messages.push(message);
            await user.save();
        } else {
            user = new User({ name, email, messages: [message] });
            // users.push(user);
            await user.save();
        }

        // Save updated users
        // await fs.writeFile(dataPath, JSON.stringify(users, null, 2));
        res.status(200).json({ message: 'user submitted successfully' });
    } catch (error) {
        console.error('Error processing form:', error);
        res.status(500).send('An error occurred while processing your submission.');
    }
});

// Update user route (currently just logs and sends a response)
app.put('/update-user/:currentName/:currentEmail', async (req, res) => {
    try {
        const { currentName, currentEmail } = req.params;
        const { newName, newEmail } = req.body;
        console.log('Current user:', { currentName, currentEmail });
        console.log('New user data:', { newName, newEmail });
        // const data = await fs.readFile(dataPath, 'utf8');
        // if (data) {
        //     let users = JSON.parse(data);
        //     const userIndex = users.findIndex(user => user.name === currentName && user.email === currentEmail);
        //     console.log(userIndex);
        //     if (userIndex === -1) {
        //         return res.status(404).json({ message: "User not found" })
        //     }
        //     users[userIndex] = { ...users[userIndex], name: newName, email: newEmail };
        //     console.log(users);
        //     await fs.writeFile(dataPath, JSON.stringify(users, null, 2));
        const user = await User.findOne({
            name: currentName, email: currentEmail
        });
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        user.name = newName || user.name;
        user.email = newEmail || user.email;
        await user.save();
        res.status(200).json({ message: `You sent ${newName} and ${newEmail}` });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send('An error occurred while updating the user.');
    }
});

app.use(express.static(publicPath)); // Serve static files from client directory
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});