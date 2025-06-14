// import request from 'supertest';
// import { jest } from '@jest/globals';
// // mock the modules
// jest.mock('../../../src/repositories/cache', () => ({
//   cache: {
//     shard: {
//       getShardWithFiles: jest.fn(),
//       saveShardWithFiles: jest.fn(),
//       getAllCollaborativeRooms: jest.fn(),
//       saveAllCollaborativeRooms: jest.fn()
//     }
//   }
// }));
// jest.mock('../../../src/repositories/db', () => ({
//   db: {
//     shard: {
//       getShardWithFiles: jest.fn(),
//       updateFiles: jest.fn(),
//       getAllCollaborativeRooms: jest.fn()
//     },
//     user: {
//       findById: jest.fn()
//     }
//   }
// }));
// import {app} from "../../../src/app"
// import { Shard, ShardWithFiles } from '../../../src/entities/shard';
// import { cache as originalCache } from '../../../src/repositories/cache';
// import { db as originalDb } from '../../../src/repositories/db';
// import { populateShardId } from '../../../src/middleware/http/shard';
// import { populateLimitOffset } from '../../../src/middleware/http/global';



// const cache = originalCache as jest.Mocked<typeof originalCache>
// const db = originalDb as jest.Mocked<typeof originalDb>



// // Import your actual Express app
// describe('Room API Routes', () => {
//   beforeEach(() => {
//     // Reset all mocks before each test
//     jest.clearAllMocks();
//   });

//   // done
//   describe('GET /api/v1/rooms/:id - fetchLatestRoomFilesState', () => {
//     // protected route
//     const mockShardWithFiles = {
//       id: 1,
//       title: "Test Room",
//       userId: "user1",
//       templateType: "react",
//       mode: "normal",
//       type: "public",
//       lastSyncTimestamp: new Date(),
//       createdAt: new Date(),
//       updatedAt: new Date(),
//       files: [
//         { id: 1, code: 'TEST123', name: 'test.txt', shardId: 1 },
//         { id: 2, code: 'TEST456', name: 'example.doc', shardId: 1 }
//       ]
//     };

//     const mockUserDetails = {
//       id: "user1",
//       createdAt: new Date(),
//       updatedAt: new Date()
//     }

//     beforeEach(() => {
//         // find user by id: protected route
//       db.user.findById.mockResolvedValue(mockUserDetails);
//     });

//     it('should fetch shard from cache when available', async () => {
//       // Mock cache hit
//       cache.shard.getShardWithFiles.mockResolvedValue(mockShardWithFiles as ShardWithFiles)
//       db.shard.updateFiles.mockResolvedValue("OK");

//       const response = await request(app)
//       .get('/api/v1/rooms/1')
//       .auth('user1', {type: "bearer"}) // populate the authorization header with bearer token
    
//       expect(response.status).toBe(200);
//       expect(cache.shard.getShardWithFiles).toHaveBeenCalledWith(1);
//       expect(db.shard.getShardWithFiles).not.toHaveBeenCalled();
//     });

//     it('should fetch shard from db when cache misses', async () => {
//       // Mock cache miss, db hit
//       cache.shard.getShardWithFiles.mockResolvedValue(null);
//       db.shard.getShardWithFiles.mockResolvedValue(mockShardWithFiles as ShardWithFiles);
//       cache.shard.saveShardWithFiles.mockResolvedValue("OK");

//       const response = await request(app)
//       .get('/api/v1/rooms/1')
//       .auth('user1', {type: "bearer"});

//       console.log(response.body);
//       console.log(response.error);
//       // expect(response.status).toBe(200);
//       expect(cache.shard.getShardWithFiles).toHaveBeenCalledWith(1);
//       expect(db.shard.getShardWithFiles).toHaveBeenCalledWith(1);
//       expect(cache.shard.saveShardWithFiles).toHaveBeenCalledWith(1, mockShardWithFiles);
//     });

//     it('should return status code 500 in case of both db and cache miss', async () => {
//       // Mock both cache and db miss
//       cache.shard.getShardWithFiles.mockResolvedValue(null);
//       db.shard.getShardWithFiles.mockResolvedValue(null);

//       const response = await request(app)
//       .get('/api/v1/rooms/1')
//       .auth("user1", {type: "bearer"})

//       expect(response.status).toBe(500);
//     });

//     it('should handle cache save failure gracefully', async () => {
//       // Mock cache miss, db hit, but cache save failure
//       cache.shard.getShardWithFiles.mockResolvedValue(null);
//       db.shard.getShardWithFiles.mockResolvedValue(mockShardWithFiles as ShardWithFiles);
//       cache.shard.saveShardWithFiles.mockResolvedValue("OK");

//       const response = await request(app)
//       .get('/api/v1/rooms/1')
//       .auth("user1", {type: "bearer"})

//       expect(response.status).toBe(200);
//       expect(response.body.data.shard.id).toEqual(1);
//     });
//   });

//   // TODO
//   describe('GET /api/v1/rooms - fetchAllRooms', () => {
//     // protected route
//     const mockRooms: Shard[] = [
//       {
//         id: 1,
//         title: "Room 1",
//         userId: "user1",
//         templateType: "react",
//         mode: "normal",
//         type: "public",
//         lastSyncTimestamp: new Date(),
//         createdAt: new Date(),
//         updatedAt: new Date()
//       },
//       {
//         id: 2,
//         title: "Room 2",
//         userId: "user1",
//         templateType: "react",
//         mode: "normal",
//         type: "public",
//         lastSyncTimestamp: new Date(),
//         createdAt: new Date(),
//         updatedAt: new Date()
//       }
//     ];

//     const mockUserDetails = {
//       id: "user1",
//       createdAt: new Date(),
//       updatedAt: new Date()
//     }

//     beforeEach(() => {
//         // find user by id: protected route
//       db.user.findById.mockResolvedValue(mockUserDetails);
//     });

//     it('should fetch rooms from cache when available', async () => {
//       // Mock cache hit
//       cache.shard.getAllCollaborativeRooms.mockResolvedValue(mockRooms);

//       const response = await request(app)
//         .get('/api/v1/rooms')
//         .query({ limit: 10, offset: 0 })
//         .auth("user1", {type: "bearer"})

//         console.log(String(response.error));
//       expect(response.status).toBe(200);
//       expect(JSON.stringify(response.body.data.rooms)).toEqual(JSON.stringify(mockRooms));
//       expect(response.body.data.source).toBe('cache');
//       expect(cache.shard.getAllCollaborativeRooms).toHaveBeenCalledWith('user1');
//       expect(db.shard.getAllCollaborativeRooms).not.toHaveBeenCalled();
//     });

//     it('should fetch rooms from db when cache misses', async () => {
//       // Mock cache miss, db hit
//       cache.shard.getAllCollaborativeRooms.mockResolvedValue(null);
//       db.shard.getAllCollaborativeRooms.mockResolvedValue(mockRooms as Shard[]);
//       cache.shard.saveAllCollaborativeRooms.mockResolvedValue("OK");

//       const response = await request(app)
//         .get('/api/v1/rooms')
//         .query({ limit: 10, offset: 0 })
//         .auth("user1", {type: "bearer"})

//         console.log(String(response.error));
//       expect(response.status).toBe(200);
//       expect(JSON.stringify(response.body.data.rooms)).toEqual(JSON.stringify(mockRooms));
//       expect(response.body.data.source).toBe('db');
//       expect(db.shard.getAllCollaborativeRooms).toHaveBeenCalledWith('user1', 10, 0);
//       expect(cache.shard.saveAllCollaborativeRooms).toHaveBeenCalledWith('user1', mockRooms);
//     });

//     it('should handle not found error', async () => {
//       // Mock both cache and db miss
//       cache.shard.getAllCollaborativeRooms.mockResolvedValue(null);
//       db.shard.getAllCollaborativeRooms.mockResolvedValue(null);

//       const response = await request(app)
//         .get('/api/v1/rooms')
//         .query({ limit: 10, offset: 0 })
//         .auth("user1", {type: "bearer"})
//         console.log(String(response.error));
//       expect(response.status).toBe(500)

//     });

//     it('should handle invalid pagination parameters', async () => {
//       const response = await request(app)
//         .get('/api/v1/rooms')
//         .query({ limit: 'invalid', offset: 'invalid' })
//         .auth("user1", {type: "bearer"})
//       expect(response.status).toBe(500);
//     });
//   });

//   // done
//   describe('Middleware Tests', () => {
//     describe('populateShardId', () => {
//       it('should populate shard id from params', async () => {
//         const req = {
//           params: { id: '123' },
//           shard: {}
//         } as any;
//         const res = {} as any;
//         const next = jest.fn();

//         await populateShardId(req, res, next);

//         expect(req.shard.id).toBe(123);
//         expect(next).toHaveBeenCalled();
//       });
//     });

//     describe('populateLimitOffset', () => {
//       it('should populate pagination from query params', async () => {
//         const req = {
//           query: { limit: '10', offset: '20' },
//           pagination: {}
//         } as any;
//         const res = {} as any;
//         const next = jest.fn();

//         await populateLimitOffset(req, res, next);

//         expect(req.pagination.limit).toBe(10);
//         expect(req.pagination.offset).toBe(20);
//         expect(next).toHaveBeenCalled();
//       });
//     });
//   });
// });