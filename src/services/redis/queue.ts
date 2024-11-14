import { DefaultJobOptions, Job, Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { RedisManager } from "./redisManager";
import { redisConfig } from "../../config";


// Job Data
interface JobData {
    [key: string]: any;
}

// Job Result
interface JobResult {
    [key: string]: any;
}

interface IQueueServiceConfig {
    queueName: string;
    redis: {
        host: string;
        password?: string;
        port: number;
    },
    defaultJobOptions?: DefaultJobOptions
}
export class QueueService {
    private queue: Queue;
    private worker: Worker;
    private conn: Redis;

    constructor(private config: IQueueServiceConfig) {
        const redisManager = RedisManager.getInstance();
        this.conn = redisManager.getConnection(redisConfig.connection.CONN_BULLMQ);

        // create new queue instance
        this.queue = new Queue(config.queueName, {
            connection: this.conn,
            defaultJobOptions: config.defaultJobOptions
        })

        // create new worker instance to process new jobs
        this.worker = new Worker(config.queueName, async (job: Job) => {
            return this.processJob(job)
        }, {
            connection: this.conn
        })

        // setup event listeners
        this.setupEventListeners();
    }

    // setup event listeners
    private setupEventListeners() {
        // executed when job completed successfully in the worker
        this.worker.on(redisConfig.event.EVENT_COMPLETED, (job: Job) => {
            console.log(`Job ${job.id} has completed successfully`);
        })

        this.worker.on(redisConfig.event.EVENT_FAILED, (job : Job | undefined, error: Error) => {
            console.error(`Job ${job?.id} has failed:`, error);
        });
      
          this.worker.on(redisConfig.event.EVENT_ERROR, (error: Error) => {
            console.error('Worker error:', error);
          });
      
          this.queue.on(redisConfig.event.EVENT_ERROR, (error: Error) => {
            console.error('Queue error:', error);
          });
      
    }


    private async processJob(job: Job): Promise<JobResult> {
        try {
          console.log(`Processing job ${job.id} of type ${job.name}`);
          
          switch (job.name) {
            case 'emailJob':
              return await this.processEmailJob(job.data);
            case 'exportJob':
              return await this.processExportJob(job.data);
            default:
              throw new Error(`Unknown job type: ${job.name}`);
          }
        } catch (error) {
          console.error(`Error processing job ${job.id}:`, error);
          throw error;
        }
    }
    
    private async processEmailJob(data: JobData): Promise<JobResult> {
        // Implement email sending logic here
        console.log('Processing email job:', data);
        return { status: 'completed', message: 'Email sent successfully' };
      }
    
      // Example job processor for export jobs
      private async processExportJob(data: JobData): Promise<JobResult> {
        // Implement export logic here
        console.log('Processing export job:', data);
        return { status: 'completed', message: 'Export completed successfully' };
      }
    

    // add new job to the queue
    async addJob<T extends JobData>(
        name: string,
        data: T,
        opts?: DefaultJobOptions
      ): Promise<Job<T, JobResult>> {
        try {
          return await this.queue.add(name, data, opts);
        } catch (error) {
          console.error(`Error adding job ${name}:`, error);
          throw error;
        }
      }


    async getJob(jobId: string): Promise<Job | null> {
        return await this.queue.getJob(jobId);
      }
    
      // Get job status
      async getJobStatus(jobId: string): Promise<string | null> {
        const job = await this.getJob(jobId);
        return job ? await job.getState() : null;
      }
    
      // Gracefully shut down the queue service
      async shutdown(): Promise<void> {
        await this.worker.close();
        await this.queue.close();
        await this.conn.quit();
      }

}