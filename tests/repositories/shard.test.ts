
// import { Shard as ShardModel } from "../../src/db/shard"
import ShardRepository from "../../src/repositories/shard"

// TODO: Update the shard repository tests with postgres as db.
describe("src/repositories/ShardRepository.findById()", () => {
    let shardRepo: ShardRepository;
    // let mongoServer: MongoMemoryServer;
    beforeAll(async () => {
        // mongoServer = await MongoMemoryServer.create(); // create memory mongodb server for tests
        // const mongoUri = mongoServer.getUri(); // get MONGODB_URL for tests
        // await mongoose.connect(mongoUri);
    })

    beforeEach(() => {
        // shardRepo = new ShardRepository(ShardModel);
    })

    describe("findById()", () => {
        it("should return null when shard not found", async () => {
            // const newId = new mongoose.Types.ObjectId(); // non-existent id
            // const result = await shardRepo.findById(newId.toString());
            // expect(result).toBeNull();
        })

        it("should fetch shard by id", async () => {
            // const testShard = new ShardModel({
            //     title: "Test Shard",
            //     creator: "Test Creator",
            //     templateType: "react",
            //     type: "private",
            //     mode: "collaboration",
            //     likes: 0,
            // });

            // await testShard.save();
            // const result = await shardRepo.findById(testShard._id as string);
            // expect(result).not.toBeNull();
            // expect(result?.title).toBe("Test Shard");
            // await ShardModel.deleteOne({
            //     _id: testShard._id
            // })
        })
    })

    describe("save()", () => {
        it("should save the document to the database", async () => {
            // const testShard = new ShardModel({
            //     title: "Test Shard",
            //     creator: "Test Creator",
            //     templateType: "react",
            //     type: "private",
            //     mode: "collaboration",
            //     likes: 0,
            // });

            // await shardRepo.save(shardRepo.toEntity(testShard));
            // expect(testShard?._id).not.toBeNull();
            // await ShardModel.deleteOne({
            //     _id: testShard._id
            // })
        })
    })

    afterAll(async () => {
        // await mongoose.disconnect();
        // await mongoServer.stop();
    })
})