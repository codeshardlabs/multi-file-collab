import TransportStream, { TransportStreamOptions }  from "winston-transport";
import { env } from "../../../config";


interface SignozTranportStreamOptions extends TransportStreamOptions {
    signozToken: string;
    serviceName: string;
    batchSize: number;
    batchTimeout: number;
    signozEndpoint: string;
}

 class SignozTransportStream extends TransportStream {
    private signozToken: string;
    private serviceName: string;
    private batchSize: number;
     private batchTimeout: number;
     private signozEndpoint: string;
     private logs: any[];
     private timer: NodeJS.Timeout | null;
    public constructor(opts: SignozTranportStreamOptions) {
        super(opts)
        this.signozEndpoint = opts.signozEndpoint;
        this.signozToken = opts.signozToken;
        this.serviceName = opts.serviceName;
        this.batchSize = opts.batchSize || 100;
        this.batchTimeout = opts.batchTimeout || 5000;
        this.logs = [];
        this.timer = null;
    }

     async log(info: any, callback: (err?: any) => void) {
        try {
            
            const logEntry = {
                timestamp: new Date().toISOString(),
                severity: info.level.toUpperCase(),
                message: info.message,
                attributes: {
                  service: this.serviceName,
                  environment: env.NODE_ENV,
                  ...info.metadata
                },
                resource: {
                  'service.name': this.serviceName,
                  'service.environment': env.NODE_ENV
                }
            };

            this.logs.push(logEntry);

      if (this.logs.length >= this.batchSize) {
        await this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.batchTimeout);
      }
        } catch (error) {
            console.log('Error in SigNoz logging:', error);
      callback(error);
        }
     }
     
     async flush() {
        if (this.logs.length === 0) return;
        
        const logsToSend = [...this.logs];
        this.logs = [];
        
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }
    
        try {
            await fetch(this.signozEndpoint, {
                method: "POST",
                body: JSON.stringify(logsToSend),
            headers: {
              'Content-Type': 'application/json',
              'signoz-access-token': this.signozToken
            }
          });
        } catch (error) {
          console.error('Error sending logs to SigNoz:', error);
          this.logs = [...logsToSend, ...this.logs];
        }
      }
}

export const signozTransportStream = new SignozTransportStream({
    signozToken: env.SIGNOZ_TOKEN,
    serviceName: env.SERVICE_NAME,
    batchSize: 100,
    batchTimeout: 5000,
    signozEndpoint: env.SIGNOZ_ENDPOINT
});