import { Request, Response, NextFunction } from "express";
import { Server } from "socket.io";

export function socketIO(io: Server) {

	let clientUUID: Record<string, string> = {};

	io.on('connection', (socket) => {

		const uuid = socket.handshake.query.uuid;
		if (uuid) {

			clientUUID[socket.id] = uuid as string;

			io.emit('client-connected', clientUUID);

			socket.on('disconnect', () => {
				if (clientUUID[socket.id]) {
					const uuid = clientUUID[socket.id]
					delete clientUUID[socket.id];

					// Check if there are any other sockets still connected with the same UUID
					const isUUIDStillConnected = Object.values(clientUUID).includes(uuid);
					if (!isUUIDStillConnected) {
						io.emit('client-disconnected', uuid);
					}
				}
			});
		};
	});

	return (req: Request, res: Response, next: NextFunction) => {
		res.locals.io = io;
		next();
	};
}
