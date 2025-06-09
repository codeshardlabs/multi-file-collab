import { ClerkClient, createClerkClient, User } from "@clerk/backend";
import { env } from "../config";
import { logger } from "./logger/logger";


class ClerkService {
    private static _clerkClient : ClerkClient;
    private static _clerkUserCache : Map<string, User> = new Map();
    private static getClerkService() : ClerkClient {
        if(!this._clerkClient) {
            this._clerkClient = createClerkClient({
                secretKey: env.CLERK_SECRET_KEY
            })
        }
        return this._clerkClient;
    }

    public get clerkClient() : ClerkClient{
        return ClerkService.getClerkService();
    }


    public async getClerkUser(userId: string) {
        if(ClerkService._clerkUserCache.has(userId)) {
            return ClerkService._clerkUserCache.get(userId);
        }
        const user = await this.clerkClient?.users?.getUser(userId);
        ClerkService._clerkUserCache.set(userId, user);
        return user;
    }

    public async getClerkUserByPrimaryEmail(userEmail: string) {

        try {
            if(ClerkService._clerkUserCache.has(userEmail)) {
                return ClerkService._clerkUserCache.get(userEmail);
            }
            const users =  await this.clerkClient.users.getUserList({
                 emailAddress: [userEmail]
             })
             if(users.data.length === 0) return null;
             ClerkService._clerkUserCache.set(userEmail, users?.data?.[0]);
             logger.info(`clerk user with email ${userEmail}: `, users?.data?.[0])
            return  users?.data?.[0];
        } catch (error) {
            logger.debug("could not get clerk user by primary email", {
                src : "ClerkService>getClerkUserByPrimaryEmail()",
                error: error
            })
            return null;
        }
    }
}

export const clerkInst = new ClerkService();