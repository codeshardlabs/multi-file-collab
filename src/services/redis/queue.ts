import { DefaultJobOptions, Job, Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { RedisManager } from "./redisManager";
import { redisConfig } from "../../config";
import { IShardRepository } from "../../interfaces/IShardRepository";

// Job Data
interface JobData {
  [key: string]: any;
}

// Job Result
interface JobResult {
  [key: string]: any;
}

interface FlushJobData extends JobData {
  roomId: string;
  activeFile: string;
  code: string;
}

interface BaseJobResult extends JobResult {
  job: string;
  status: "completed" | "failed" | "finished";
}

interface IQueueServiceConfig {
  queueName: string;
  defaultJobOptions?: DefaultJobOptions
}

export class QueueService {
  private queue: Queue;
  private worker: Worker;
  private conn: Redis;
  private shardRepo: IShardRepository;

  constructor(config: IQueueServiceConfig,  shardRepo: IShardRepository) {
    const redisManager = RedisManager.getInstance();
    this.conn = redisManager.getConnection(redisConfig.connection.CONN_BULLMQ);
    // create new queue instance
    this.shardRepo = shardRepo;
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

    this.setupEventListeners();
  }

  private setupEventListeners() {
    // executed when job completed successfully in the worker
    this.worker.on(redisConfig.event.EVENT_COMPLETED, (job: Job) => {
      console.log(`Job ${job.id} has completed successfully`);
    })

    this.worker.on(redisConfig.event.EVENT_FAILED, (job: Job | undefined, error: Error) => {
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
        case redisConfig.job.JOB_FLUSH:
          return await this.processFlushJob(job.data);
        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
      throw error;
    }
  }

  private async processEmailJob(data: JobData): Promise<JobResult> {
    // TODO: Implement email sending logic here
    console.log('Processing email job:', data);
    return { status: 'completed', message: 'Email sent successfully' };
  }

  private async processFlushJob(data: FlushJobData): Promise<BaseJobResult> {
    // flush the data to database
    // for a particular Shard Id: which is roomId in this case
    try {
      const room = await this.shardRepo.findById(data.roomId);
      if (room) {
        let files = room.files;
        const ind = files.findIndex((file) => file.name == data.activeFile);
        if (ind == -1) {
          // not added to db
          files.push({
            name: data.activeFile,
            code: data.code
          });
        }
        else {
          // already in db
          files[ind].code = data.code;
        }

        room.files = files;

        await this.shardRepo.save(room);
        return { status: "completed", job: redisConfig.job.JOB_FLUSH }
      }

    } catch (error) {
      console.log("error occurred: ", error)
      return { status: "failed", job: redisConfig.job.JOB_FLUSH }
    }

    return { status: "finished", job: redisConfig.job.JOB_FLUSH }
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

