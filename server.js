const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const PORT = 3000;

// Serve static files
app.use(express.static(__dirname));

// Socket.IO connection handling
io.on('connection', (socket) => {
    socket.on('joinEvent', (eventId) => {
        socket.join(`event-${eventId}`);
    });

    socket.on('chatMessage', (data) => {
        io.to(`event-${data.eventId}`).emit('newMessage', {
            user: data.user,
            message: data.message,
            timestamp: new Date()
        });
    });

    socket.on('updateParticipants', (data) => {
        io.to(`event-${data.eventId}`).emit('participantsUpdated', {
            count: data.count,
            eventId: data.eventId
        });
    });
});

// Serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

http.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}/`);
});