
// Redis connection names
const CONN_DEFAULT = "conn:default";
const CONN_PUBLISHER = "conn:publisher";
const CONN_SUBSCRIBER = "conn:subscriber";
const CONN_KV_STORE = "conn:kvstore";
const CONN_BULLMQ = "conn:bullmq";

// worker and queue events
const EVENT_COMPLETED = "completed";
const EVENT_FAILED = "failed";
const EVENT_ERROR = "error";

// queue jobs
const JOB_FLUSH = "job:flush"

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
    },
    job: {
        JOB_FLUSH
    }
} as const;

enum errors {
    ROOM_ID_NOT_FOUND,
    TOKEN_NOT_FOUND,
    USER_NOT_FOUND,
}

const errorMessage = new Map<number, string>();
errorMessage.set(errors.ROOM_ID_NOT_FOUND, "Room ID Not Found");
errorMessage.set(errors.TOKEN_NOT_FOUND, "Token Not Found");
errorMessage.set(errors.USER_NOT_FOUND, "User Not Found");

export {
    redisConfig,
    errors,
    errorMessage
}