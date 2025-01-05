import { transports } from "winston";


export const fileTransportStream = new transports.File({
    filename: `logs/debug.log`
});