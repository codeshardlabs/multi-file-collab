import { ClerkClient, createClerkClient } from "@clerk/backend";
import { env } from "../config";
import { logger } from "./logger/logger";


class ClerkService {
    private static _clerkClient : ClerkClient;
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
       return await this.clerkClient?.users?.getUser(userId);
    }

    public async getClerkUserByPrimaryEmail(userEmail: string) {

        try {
            const users =  await this.clerkClient.users.getUserList({
                 emailAddress: [userEmail]
             })
     
             logger.info(`clerk user with email ${userEmail}: `, users)
             if(users.data.length === 0) return null;
            return  users?.data?.[0] ?? null;
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