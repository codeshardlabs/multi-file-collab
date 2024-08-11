import { Producer } from "kafkajs";
import kafka from ".";

let producer : Producer | null = null;

const createProducer = async () => {
    if (!producer) {
         producer = kafka.producer();
    }
    await producer.connect();
    return producer;
}


export const produceMessage = async ({ activeFile, data, roomId }: { activeFile: string; data: string; roomId: string; }) => {
    const producer = await createProducer();
    await producer.send({
        topic: "multitab-collab",
        messages: [
            {
                key: activeFile,
                value: JSON.stringify({
                    roomId: roomId,
                    data: data
                })
            }
        ]
    });

    console.log("message sent successfully");

    await producer.disconnect();
    return true;
}