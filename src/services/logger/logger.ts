import winston, { createLogger, format, transport } from "winston";
import TransportStream from "winston-transport";
import { env } from "../../config";
import { ILogger } from "../../interfaces/ILogger";
import { signozTransportStream } from "./transports/signoz";
import { consoleTransportStream } from "./transports/console";
import { fileTransportStream } from "./transports/file";


export class WinstonLogger implements ILogger {
    private _logger: winston.Logger;
    private env: string;
    public constructor() {
        this.env = process.env.NODE_ENV!;
        let temp: TransportStream[] = [consoleTransportStream]
        if (this.env === "production") {
            temp.push(signozTransportStream);
        }
        else {
            temp.push(fileTransportStream);
        }

        this._logger = createLogger({
            level: this.env === "production" ? "info" : "debug",
            format: format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.metadata(),
                winston.format.json()
            ),
            defaultMeta: {
                service: env.SERVICE_NAME
            },
            transports: [
                ...temp
            ]
        })
    }

    public addNewTransport(t: transport): void {
        this._logger = this._logger.add(t);
    }

    public info(message: string, ...meta: any[]) {
        this._logger.info(message, ...meta);
    }

    public error(message: string, ...meta: any[]) {
        this._logger.error(message, ...meta);
    }

    public warn(message: string, ...meta: any[]) {
        this._logger.warn(message, ...meta);
    }
    public debug(message: string, ...meta: any[]) {
        this._logger.debug(message, ...meta);
    }
}

export const logger = new WinstonLogger();