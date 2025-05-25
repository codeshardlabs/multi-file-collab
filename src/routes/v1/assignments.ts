import { Router, Request, Response } from "express";
import { assignmentUsecases } from "../../repositories/db/usecases/assignment";
import { authMiddleware } from "../../middleware/http/auth";

const router = Router();

type CreateAssignmentBody = {
  title: string;
  description: string;
  deadline?: string;
  requirements: string;
};

// Create a new assignment
router.post("/", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as CreateAssignmentBody;
    const createdBy = req.auth?.user.id;

    const assignment = await assignmentUsecases.createAssignment({
      title: body.title,
      description: body.description,
      deadline: body.deadline ? new Date(body.deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      requirements: body.requirements,
      createdBy,
    });

    res.status(201).json(assignment);
  } catch (error) {
    console.error("[ASSIGNMENTS_POST]", error);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

// Get all assignments
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const assignments = await assignmentUsecases.getAssignments();
    console.log("assignments", assignments);
    res.json(assignments);
  } catch (error) {
    console.error("[ASSIGNMENTS_GET]", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// Get assignments created by a specific user
router.get("/creator/:userId", async (req: Request<{ userId: string }>, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const assignments = await assignmentUsecases.getAssignmentsByCreator(userId);
    res.json(assignments);
  } catch (error) {
    console.error("[ASSIGNMENTS_GET_CREATOR]", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// Get a specific assignment
router.get("/:id", async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assignment = await assignmentUsecases.getAssignmentById(Number(id));

    if (!assignment) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    res.json(assignment);
  } catch (error) {
    console.error("[ASSIGNMENTS_GET_ID]", error);
    res.status(500).json({ error: "Failed to fetch assignment" });
  }
});

// Submit a project for an assignment
router.post("/:id/submit", authMiddleware, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { shardId, shardLink } = req.body;
    const userId = req.auth.user.id;

    // Check if assignment exists and deadline hasn't passed
    const assignment = await assignmentUsecases.getAssignmentById(Number(id));
    if (!assignment) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    if (new Date() > new Date(assignment.deadline)) {
      res.status(400).json({ error: "Assignment deadline has passed" });
      return;
    }

    // Check if user has already submitted
    const existingSubmission = await assignmentUsecases.getSubmissionByUserAndAssignment(
      userId,
      Number(id)
    );
    if (existingSubmission) {
      res.status(400).json({ error: "You have already submitted for this assignment" });
      return;
    }

    const submission = await assignmentUsecases.createSubmission({
      assignmentId: Number(id),
      userId,
      shardId,
      shardLink,
    });

    res.status(201).json(submission);
  } catch (error) {
    console.error("[ASSIGNMENTS_SUBMIT]", error);
    res.status(500).json({ error: "Failed to submit project" });
  }
});

// Get submissions for an assignment
router.get("/:id/submissions", authMiddleware, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.auth.user.id;

    // Check if assignment exists
    const assignment = await assignmentUsecases.getAssignmentById(Number(id));
    if (!assignment) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    // Only allow assignment creator to view submissions
    if (assignment.createdBy !== userId) {
      res.status(403).json({ error: "Not authorized to view submissions" });
      return;
    }

    const submissions = await assignmentUsecases.getSubmissionsByAssignment(Number(id));
    res.json(submissions);
  } catch (error) {
    console.error("[ASSIGNMENTS_GET_SUBMISSIONS]", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// Delete an assignment
router.delete("/:id", authMiddleware, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if assignment exists
    const assignment = await assignmentUsecases.getAssignmentById(Number(id));
    if (!assignment) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    // Only allow assignment creator to delete
    if (assignment.createdBy !== userId) {
      res.status(403).json({ error: "Not authorized to delete assignment" });
      return;
    }

    await assignmentUsecases.deleteAssignment(Number(id));
    res.status(204).send();
  } catch (error) {
    console.error("[ASSIGNMENTS_DELETE]", error);
    res.status(500).json({ error: "Failed to delete assignment" });
  }
});

export default router; 