import { Kafka, logLevel } from "kafkajs";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

config();


let kafka = new Kafka({
    brokers: [process.env.KAFKA_BROKER!],
    ssl: {
        ca: [fs.readFileSync(path.resolve("./ca.pem"), "utf-8")]
    },
    sasl: {
        mechanism: 'plain',
        username: process.env.KAFKA_USERNAME!, 
        password: process.env.KAFKA_PASSWD!
    },
    logLevel: logLevel.ERROR
})   



export default kafka;