
## Multi File Realtime Collaboration Server

### Overview

multitab collaboration socket.io server using redis kv store for room management, redis pub/sub for scaling websockets, bullmq queue and workers for flushing realtime code state to db.

 `RedisManager` is a singleton class, i.e. there will be only one instance of this class in the entire application. This redis manager instance will have a particular connection pool of redis instances for handling KV store management, acting as pub/sub for publishing and subscribing to particular channel, and being used in running background jobs via bullmq.

### Current Workflow
![Current Workflow](/public/workflow.png)


