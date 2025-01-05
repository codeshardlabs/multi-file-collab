import TransportStream, { TransportStreamOptions }  from "winston-transport";
import { env } from "../../../config";


interface SignozTranportStreamOptions extends TransportStreamOptions {
    signozToken: string;
    serviceName: string;
    batchSize: number;
    batchTimeout: number;
}

 class SignozTransportStream extends TransportStream {
    private signozToken: string;
    private serviceName: string;
    private batchSize: number;
    private batchTimeout: number;
    private logs: any[];
    public constructor(opts: SignozTranportStreamOptions) {
        super(opts)
        this.signozToken = opts.signozToken;
        this.serviceName = opts.serviceName;
        this.batchSize = opts.batchSize || 100;
        this.batchTimeout = opts.batchTimeout || 5000;
        this.logs = [];
    }

    async log() {

    }
}

export const signozTransportStream = new SignozTransportStream({
    signozToken: env.SIGNOZ_TOKEN,
    serviceName: env.SERVICE_NAME,
    batchSize: 100,
    batchTimeout: 5000,
});