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
            // If there are users waiting, randomly pair the current user with one of them
            const randomIndex = Math.floor(Math.random() * waitingQueue.length);
            const partnerSocketId = waitingQueue.splice(randomIndex, 1)[0];
            activeChats[socket.id] = partnerSocketId;
            activeChats[partnerSocketId] = socket.id;

            // Notify both users they've been paired
            socket.emit('connectedToChatPartner', partnerSocketId);
            io.to(partnerSocketId).emit('connectedToChatPartner', socket.id);
        } else {
            // If no one is waiting, add the current user to the queue
            waitingQueue.push(socket.id);
        }
    });

    socket.on('sendMessage', (message) => {
        const partnerSocketId = activeChats[socket.id];
        if (partnerSocketId) {
            io.to(partnerSocketId).emit('receiveMessage', {
                from: socket.id,
                text: message.text,
            });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        
        const partnerSocketId = activeChats[socket.id];

        // Remove from active chats and notify the partner if they exist
        if (partnerSocketId) {
            io.to(partnerSocketId).emit('partnerDisconnected');
            delete activeChats[partnerSocketId];
            delete activeChats[socket.id];
        }

        // Remove from waiting queue if they were waiting
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
