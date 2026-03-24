import * as session from 'express-session';

declare module 'express-session' {
    interface SessionData {
        user: {
            user_id: string
            roles: {
                admin: number,
                program_head: number,
                voter: number,
            },
        },
        deviceRegistrationStatus: string,
        ipRegistered: boolean,
        faceVerified: boolean,
    }
}