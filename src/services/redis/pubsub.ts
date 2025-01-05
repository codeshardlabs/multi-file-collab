import Redis from "ioredis";
import { RedisManager } from "./redisManager";
import { redisConfig } from "../../config";

export class PubSubService {
    private publisher: Redis;
  private subscriber: Redis;
  constructor() {
        const redisManager = RedisManager.getInstance();
        this.publisher = redisManager.getConnection(redisConfig.connection.CONN_PUBLISHER);
        this.subscriber = redisManager.getConnection(redisConfig.connection.CONN_SUBSCRIBER);
    }

    async publish(channel: string, message: string): Promise<number> {
        return await this.publisher.publish(channel, message);
    }
    

    async subscribe(channel: string, callback: (error: Error | null, message: string | null) => void): Promise<void> {
        // subscribe to particular channel
        await this.subscriber.subscribe(channel);
        // upon message receival, verify the channel and upon match, call the callback.
        this.subscriber.on('message', (ch: string, message: string) => {
          if (ch === channel) {
            callback(null, message);
          }
        });
      
      this.subscriber.on("error", (error: Error) => {
        callback(error, null);
      })
    }
    
  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel);
  }

 }