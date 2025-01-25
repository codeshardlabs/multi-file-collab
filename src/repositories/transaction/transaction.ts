import { Comment } from "../../entities/comment";
import { logger } from "../../services/logger/logger";
import { isOfType } from "../../utils";

type funcType<T> = (...args: any[]) => Promise<T>;

interface TransactionOperation<T, U> {
  execute: funcType<T>;
  rollback: funcType<U>;
  done: boolean;
  out: unknown | null;
  execType: T,
  rbType: U
}

class Transaction {
  private operations: TransactionOperation<any, any>[] = [];
  
  static begin(): Transaction {
    return new Transaction();
  }

  add<T, U>(
    execute: funcType<T>,
    rollback: funcType<U>
  ) {
    this.operations.push({
      execute,
      rollback,
      done: false,
      out: null,
      execType: {} as T,
      rbType: {} as U
    });
    return this;
  }

  async exec() {
    const executedOps: TransactionOperation<any, any>[] = [];
    
    try {
      for (const op of this.operations) {
        try {
          
          const out = await op.execute();
          if(!out) {
            throw new Error("could not execute operation of Tx")
          }
          executedOps.push(op);
          op.done = true;
        } catch (error) {
          op.done = false;
          logger.error("could not execute transaction operation", {
            error: error,
            operationType: op.execType
          });
          throw error;
        }
      }
    } catch (error) {
      logger.error("Transaction failed, starting rollback", error);
      
      for (const op of executedOps.reverse()) {
        try {
          if(op.done) {
            if (isOfType<Comment>(op.out, ['id', 'message', 'shardId', 'userId'])) {
              await op.rollback(op.out.id);
            }
            await op.rollback();
          }
        } catch (rollbackError) {
          logger.error("Rollback failed for operation", {
            error: rollbackError,
          });
        }
      }
      
      throw error;
    }
  }

  
}

export { Transaction, TransactionOperation };