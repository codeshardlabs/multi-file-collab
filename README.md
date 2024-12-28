
## Multi File Realtime Collaboration Server

### Overview

multitab collaboration socket.io server using redis kv store for room management, redis pub/sub for scaling websockets, bullmq queue and workers for flushing realtime code state to db.


### Components 

- `SocketService` is a socket.io server providing realtime bidirectional communication channel for sending realtime code updates from client and propagate them to other clients.

 - `RedisManager` is a singleton class, i.e. there will be only one instance of this class in the entire application. This redis manager instance will have a particular connection pool of redis instances for handling KV store management, acting as pub/sub for publishing and subscribing to particular channel, and being used in running background jobs via bullmq.

  ```typescript
  class RedisManager {
    private static redisManagerInst: RedisManager;
    private pool: Map<string, Redis> = new Map()
    private constructor() { }
    
    static getInstance(): RedisManager {
        if (RedisManager.redisManagerInst == null) {
            RedisManager.redisManagerInst = new RedisManager();
        }
        return RedisManager.redisManagerInst;
    }

    // checks if there is existing connection or not by connection name, and if not create new connection and add it to the pool
    getConnection(name: string = redisConfig.connection.CONN_DEFAULT): Redis {
        if (!this.pool.has(name)) {
          const connection = new Redis(process.env.REDIS_URL!, {
            maxRetriesPerRequest: null
          });
          this.pool.set(name, connection);
        }
        return this.pool.get(name)!;
      }
    
    // close all connections and delete the corresponding values from the in-memory map
      async closeAll(): Promise<void> {
        for (const [name, connection] of this.pool.entries()) {
          await connection.quit();
          this.pool.delete(name);
        }
      }
    
}
  ```

 -  `ShardRepository` for Mongoose Database Query Abstractions, ensuring loose coupling between services using the repository for CRUD operations via `IShardRepository` interface.

  ```typescript
  export interface IShardRepository {
    findById: (id: string) => Promise<Shard | null>
    save(doc: Shard): Promise<void> 
  }
  ```

### Current Workflow
![Current Workflow](/public/workflow.png)


