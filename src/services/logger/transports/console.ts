import { format, transports } from "winston";
const { combine, colorize, simple } = format;


export const consoleTransportStream = new transports.Console({
 format: combine(colorize(), simple())
});