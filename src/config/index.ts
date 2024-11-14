
// Redis connection names
const CONN_DEFAULT = "default";
const CONN_PUBLISHER = "publisher";
const CONN_SUBSCRIBER = "subscriber";
const CONN_KV_STORE = "kv-store";
const CONN_BULLMQ = "bullmq";

// worker and queue events
const EVENT_COMPLETED = "completed";
const EVENT_FAILED = "failed";
const EVENT_ERROR = "error";


// REDIS config
const redisConfig = {
    connection: {
        CONN_BULLMQ,
        CONN_DEFAULT,
        CONN_PUBLISHER,
        CONN_SUBSCRIBER,
        CONN_KV_STORE 
    },
    event: {
        EVENT_COMPLETED,
        EVENT_ERROR,
        EVENT_FAILED
    }
} as const;

export {
    redisConfig
}