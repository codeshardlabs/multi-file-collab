import { logger } from "../../services/logger/logger";

type funcType<T> = (...args: any[]) => Promise<T>;


interface TransactionOperation<T, U> {
  execute: funcType<T>;
  rollback: funcType<U>;
  done: boolean;
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
      done: false
    });
    return this;
  }

  async exec() {
    const executedOps: TransactionOperation<any, any>[] = [];
    
    try {
      for (const op of this.operations) {
        try {
          
          await op.execute();
          executedOps.push(op);
          op.done = true;
        } catch (error) {
          op.done = false;
          logger.error("could not execute transaction operation");
          throw error;
        }
      }
    } catch (error) {
      logger.error("Transaction failed, starting rollback", error);
      
      for (const op of executedOps.reverse()) {
        try {
          if(op.done) {
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