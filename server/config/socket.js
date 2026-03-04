let _io = null;

const init = (httpServer) => {
    const { Server } = require('socket.io');
    _io = new Server(httpServer, {
        cors: {
            origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
            methods: ['GET', 'POST']
        }
    });

    _io.on('connection', (socket) => {
        // Each user joins a room named after their userId
        socket.on('join', (userId) => {
            socket.join(`user_${userId}`);
        });

        socket.on('disconnect', () => {});
    });

    return _io;
};

const getIO = () => {
    if (!_io) throw new Error('Socket.io not initialized');
    return _io;
};

module.exports = { init, getIO };
