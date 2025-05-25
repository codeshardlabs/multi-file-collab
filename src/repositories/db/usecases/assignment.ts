import { commonDb } from "../../../db";
import { assignments, submissions } from "../../../db/tables";
import { eq, and, desc } from "drizzle-orm";

export interface CreateAssignmentParams {
  title: string;
  description: string;
  deadline: Date;
  requirements: string;
  createdBy: string;
}

export interface CreateSubmissionParams {
  assignmentId: number;
  userId: string;
  shardId: string;
  shardLink: string;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  deadline: Date;
  requirements: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface Submission {
  id: number;
  assignmentId: number;
  userId: string;
  shardId: string;
  shardLink: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export const assignmentUsecases = {
  createAssignment: async (params: CreateAssignmentParams): Promise<Assignment> => {
    const [assignment] = await commonDb
      .insert(assignments)
      .values({
        ...params,
        createdBy: params.createdBy,
        createdAt: new Date(),
        updatedAt: null,
      })
      .returning();
    return assignment;
  },

  getAssignments: async (): Promise<Assignment[]> => {
    return await commonDb
      .select()
      .from(assignments)
      .orderBy(desc(assignments.createdAt));
  },

  getAssignmentById: async (id: number): Promise<Assignment | undefined> => {
    const [assignment] = await commonDb
      .select()
      .from(assignments)
      .where(eq(assignments.id, id));
    return assignment;
  },

  getAssignmentsByCreator: async (userId: string): Promise<Assignment[]> => {
    return await commonDb
      .select()
      .from(assignments)
      .where(eq(assignments.createdBy, userId))
      .orderBy(desc(assignments.createdAt));
  },

  createSubmission: async (params: CreateSubmissionParams): Promise<Submission> => {
    const [submission] = await commonDb
      .insert(submissions)
      .values(params)
      .returning();
    return submission;
  },

  getSubmissionsByAssignment: async (assignmentId: number): Promise<Submission[]> => {
    return await commonDb
      .select()
      .from(submissions)
      .where(eq(submissions.assignmentId, assignmentId))
      .orderBy(desc(submissions.createdAt));
  },

  getSubmissionByUserAndAssignment: async (
    userId: string,
    assignmentId: number
  ): Promise<Submission | undefined> => {
    const [submission] = await commonDb
      .select()
      .from(submissions)
      .where(
        and(
          eq(submissions.userId, userId),
          eq(submissions.assignmentId, assignmentId)
        )
      );
    return submission;
  },

  deleteAssignment: async (id: number): Promise<void> => {
    await commonDb.delete(assignments).where(eq(assignments.id, id));
  },
}; 