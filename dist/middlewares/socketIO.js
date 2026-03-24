"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketIO = void 0;
function socketIO(io) {
    let clientUUID = {};
    io.on('connection', (socket) => {
        const uuid = socket.handshake.query.uuid;
        if (uuid) {
            clientUUID[socket.id] = uuid;
            io.emit('client-connected', clientUUID);
            socket.on('disconnect', () => {
                if (clientUUID[socket.id]) {
                    const uuid = clientUUID[socket.id];
                    delete clientUUID[socket.id];
                    // Check if there are any other sockets still connected with the same UUID
                    const isUUIDStillConnected = Object.values(clientUUID).includes(uuid);
                    if (!isUUIDStillConnected) {
                        io.emit('client-disconnected', uuid);
                    }
                }
            });
        }
        ;
    });
    return (req, res, next) => {
        res.locals.io = io;
        next();
    };
}
exports.socketIO = socketIO;
