const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Replace with your frontend's origin in production
        methods: ["GET", "POST"],
    }
});

// Enable CORS for all routes
app.use(cors());

let waitingQueue = []; // Queue for users waiting to chat
let activeChats = {};  // Store active chat pairs

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('findChatPartner', () => {
        if (waitingQueue.length > 0) {
            // Randomly pair the current user with one from the queue
            const randomIndex = Math.floor(Math.random() * waitingQueue.length);
            const partnerSocketId = waitingQueue.splice(randomIndex, 1)[0];

            // Store the chat pair in activeChats
            activeChats[socket.id] = partnerSocketId;
            activeChats[partnerSocketId] = socket.id;

            // Notify both users they've been paired
            socket.emit('connectedToChatPartner', partnerSocketId);
            io.to(partnerSocketId).emit('connectedToChatPartner', socket.id);
        } else {
            // Add current user to the waiting queue if no one is waiting
            waitingQueue.push(socket.id);
        }
    });

    socket.on('sendMessage', (message) => {
        const partnerSocketId = activeChats[socket.id];
        if (partnerSocketId) {
            // Send the message only to the partner, not to the sender
            io.to(partnerSocketId).emit('receiveMessage', {
                from: socket.id,
                text: message.text,
            });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);

        const partnerSocketId = activeChats[socket.id];

        if (partnerSocketId) {
            // Notify the partner that their partner has disconnected
            io.to(partnerSocketId).emit('partnerDisconnected');

            // Remove both users from the active chat pair
            delete activeChats[partnerSocketId];
            delete activeChats[socket.id];
        }

        // Remove the user from the waiting queue if they were waiting
        waitingQueue = waitingQueue.filter(id => id !== socket.id);
    });
});

app.get('/', (req, res) => {
    res.send('Random Chat Server is running');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});