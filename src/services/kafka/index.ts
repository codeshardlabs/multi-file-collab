import { Kafka, logLevel } from "kafkajs";
import { config } from "dotenv";
config();

const kafka = new Kafka({
    brokers: [process.env.KAFKA_BROKER!],
    ssl: true,
    sasl: {
        mechanism: 'scram-sha-256',
        username: process.env.KAFKA_USERNAME!, 
        password: process.env.KAFKA_PASSWD!
    },
    logLevel: logLevel.ERROR
})

export default kafka;