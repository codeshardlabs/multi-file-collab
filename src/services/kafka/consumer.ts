import kafka from ".";
import { Shard } from "../../models/shard";

const consumer = kafka!.consumer({
    groupId: "default"
});

export const consumeMessage = async () => {
    await consumer.connect();
    await consumer.subscribe({
        topic: 'multitab-collab',
        fromBeginning: true
    });

    await consumer.run({
        autoCommit: true,
        eachMessage: async ({ message, pause }) => {
            if (!message.key || !message.value) {
                return;
           }
            const activeFile = message.key!.toString();
            console.log("Message received");
            
            const {data, roomId} = JSON.parse(message.value!.toString()) as { data: string; roomId: string; };


            console.log("Active File: ", activeFile);
            console.log("Data: ", data);
            console.log("Room ID: ", roomId);
           
                try {
                    const room = await Shard.findById(roomId);
                    if (room) {
                        let files = room.files;
                        const ind = files.findIndex((file) => file.name == activeFile);
                        if (ind == -1) {
                            // not added to db
                            files.push({
                                name: activeFile,
                                code: data
                            });

                        }
                        else {
                            // already in db
                            files[ind].code = data; 
                        }

                        room.files = files;

                        setTimeout(async () => {
                            await room.save();
                        }, 10*1000);
                    }

                } catch (error) {
                    pause();
                    setTimeout(() => consumer.resume([{ topic: 'multitab-collab' }]), 5 * 1000);
                }
            

        }
    })

}



