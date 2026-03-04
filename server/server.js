require('dotenv').config();
const http       = require('http');
const app        = require('./app');
const socketIO   = require('./config/socket');

const PORT   = process.env.PORT || 5000;
const server = http.createServer(app);

// Attach Socket.io
socketIO.init(server);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
