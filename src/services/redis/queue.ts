import { DefaultJobOptions, Job, Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { RedisManager } from "./redisManager";
import { redisConfig } from "../../config";
import { IShardRepository } from "../../interfaces/repositories/shard";
import { logger } from "../logger/logger";

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
  defaultJobOptions?: DefaultJobOptions;
}

export class QueueService {
  private queue: Queue;
  private worker: Worker;
  private conn: Redis;
  private shardRepo: IShardRepository;
  constructor(config: IQueueServiceConfig, shardRepo: IShardRepository) {
    const redisManager = RedisManager.getInstance();
    this.conn = redisManager.getConnection(redisConfig.connection.CONN_BULLMQ);
    // create new queue instance
    this.shardRepo = shardRepo;
    this.queue = new Queue(config.queueName, {
      connection: this.conn,
      defaultJobOptions: config.defaultJobOptions,
    });

    // create new worker instance to process new jobs, creates new worker thread to handle new request
    this.worker = new Worker(
      config.queueName,
      async (job: Job) => {
        return this.processJob(job);
      },
      {
        connection: this.conn,
        concurrency: 3, // handles 3 jobs concurrently
        limiter: {
          max: 10,
          duration: 1000, // handle  max. 10 jobs per sec
        },
      },
    );

    this.setupEventListeners();
  }

  private setupEventListeners() {
    // executed when job completed successfully in the worker
    this.worker.on(redisConfig.event.EVENT_COMPLETED, (job: Job) => {
      logger.info(`Job ${job.id} has completed successfully`, {
        src: "setupEventListeners()",
        event: redisConfig.event.EVENT_COMPLETED,
        jobId: job.id,
      });
    });

    this.worker.on(
      redisConfig.event.EVENT_FAILED,
      (job: Job | undefined, error: Error) => {
        logger.warn(`Job ${job?.id} has failed:`, {
          src: "setupEventListeners()",
          event: redisConfig.event.EVENT_FAILED,
          jobId: job?.id,
        });
      },
    );

    this.worker.on(redisConfig.event.EVENT_ERROR, (error: Error) => {
      logger.warn("Worker error", {
        src: "setupEventListeners()",
        event: redisConfig.event.EVENT_ERROR,
      });
    });

    this.queue.on(redisConfig.event.EVENT_ERROR, (error: Error) => {
      logger.warn("Queue error", {
        src: "setupEventListeners()",
        event: redisConfig.event.EVENT_ERROR,
      });
    });
  }

  private async processJob(job: Job): Promise<JobResult> {
    try {
      logger.debug(`Processing job ${job.id} of type ${job.name}`, {
        jobId: job.id,
        jobName: job.name,
        src: "processJob()",
      });

      switch (job.name) {
        case "emailJob":
          return await this.processEmailJob(job.data);
        case redisConfig.job.JOB_FLUSH:
          return await this.processFlushJob(job.data);
        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      logger.warn(`Error processing job ${job.id}:`, {
        error: error,
        jobId: job.id,
        src: "processJob()",
      });
      throw error;
    }
  }

  private async processEmailJob(data: JobData): Promise<JobResult> {
    // TODO: Implement email sending logic here
    logger.debug("Processing email job", {
      src: "processEmailJob()",
      data: data,
    });
    return { status: "completed", message: "Email sent successfully" };
  }

  private async processFlushJob(data: FlushJobData): Promise<BaseJobResult> {
    // flush the data to database
    // for a particular Shard Id: which is roomId in this case
    try {
      // const room : Shard | null = await this.shardRepo.findById(data.roomId);
      const files = await this.shardRepo.updateFiles(Number(data.roomId), {
        code: data.code,
        name: data.activeFile,
      });
      if (!files) throw new Error("could not update files");

      return { status: "completed", job: redisConfig.job.JOB_FLUSH };
    } catch (error) {
      logger.warn("Job Failed", {
        type: redisConfig.job.JOB_FLUSH,
        src: "processFlushJob()",
        error: error,
      });
      return { status: "failed", job: redisConfig.job.JOB_FLUSH };
    }

    return { status: "finished", job: redisConfig.job.JOB_FLUSH };
  }

  // add new job to the queue
  async addJob<T extends JobData>(
    name: string,
    data: T,
    opts?: DefaultJobOptions,
  ): Promise<Job<T, JobResult>> {
    try {
      return await this.queue.add(name, data, opts);
    } catch (error) {
      logger.warn(`Error adding job`, {
        name,
        data,
        src: "addJob",
      });
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

