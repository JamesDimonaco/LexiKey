import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Assignment System (B2B Feature)
 *
 * Teachers can create and assign word lists to classrooms
 * Students complete assignments and track progress
 */

// ====================
// QUERIES
// ====================

/**
 * Get all assignments for a classroom
 */
export const getClassroomAssignments = query({
  args: {
    classroomId: v.id("classrooms"),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { classroomId, isActive }) => {
    let query = ctx.db
      .query("assignments")
      .withIndex("by_classroomId", (q) => q.eq("classroomId", classroomId));

    const assignments = await query.collect();

    // Filter by active status if provided
    if (isActive !== undefined) {
      return assignments.filter((a) => a.isActive === isActive);
    }

    return assignments;
  },
});

/**
 * Get all assignments for a teacher
 */
export const getTeacherAssignments = query({
  args: {
    teacherId: v.id("users"),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { teacherId, isActive }) => {
    let query = ctx.db
      .query("assignments")
      .withIndex("by_teacherId", (q) => q.eq("teacherId", teacherId));

    const assignments = await query.collect();

    if (isActive !== undefined) {
      return assignments.filter((a) => a.isActive === isActive);
    }

    return assignments;
  },
});

/**
 * Get all assignments for a student
 */
export const getStudentAssignments = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, { studentId }) => {
    // Get student assignment entries
    const studentAssignments = await ctx.db
      .query("studentAssignments")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .collect();

    // Join with assignment details
    const assignments = await Promise.all(
      studentAssignments.map(async (sa) => {
        const assignment = await ctx.db.get(sa.assignmentId);
        return {
          ...sa,
          assignmentDetails: assignment,
        };
      })
    );

    return assignments;
  },
});

/**
 * Get assignment by ID with details
 */
export const getAssignmentById = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, { assignmentId }) => {
    const assignment = await ctx.db.get(assignmentId);
    if (!assignment) {
      return null;
    }

    // Get word details
    const words = await Promise.all(
      assignment.wordIds.map((wordId) => ctx.db.get(wordId))
    );

    return {
      ...assignment,
      words: words.filter((w) => w !== null),
    };
  },
});

/**
 * Get assignment progress for all students
 */
export const getAssignmentProgress = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, { assignmentId }) => {
    const studentAssignments = await ctx.db
      .query("studentAssignments")
      .withIndex("by_assignmentId", (q) => q.eq("assignmentId", assignmentId))
      .collect();

    // Join with student details
    const progress = await Promise.all(
      studentAssignments.map(async (sa) => {
        const student = await ctx.db.get(sa.studentId);
        return {
          ...sa,
          studentName: student?.name || "Unknown",
          studentEmail: student?.email,
        };
      })
    );

    return progress;
  },
});

/**
 * Get student's progress on specific assignment
 */
export const getStudentAssignmentProgress = query({
  args: {
    studentId: v.id("users"),
    assignmentId: v.id("assignments"),
  },
  handler: async (ctx, { studentId, assignmentId }) => {
    const progress = await ctx.db
      .query("studentAssignments")
      .withIndex("by_student_assignment", (q) =>
        q.eq("studentId", studentId).eq("assignmentId", assignmentId)
      )
      .first();

    return progress;
  },
});

/**
 * Get overdue assignments for a student
 */
export const getOverdueAssignments = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, { studentId }) => {
    const now = Date.now();

    const studentAssignments = await ctx.db
      .query("studentAssignments")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .filter((q) => q.neq(q.field("status"), "completed"))
      .collect();

    // Get assignments with due dates
    const overdueAssignments = await Promise.all(
      studentAssignments.map(async (sa) => {
        const assignment = await ctx.db.get(sa.assignmentId);
        if (assignment && assignment.dueDate && assignment.dueDate < now) {
          return {
            ...sa,
            assignmentDetails: assignment,
          };
        }
        return null;
      })
    );

    return overdueAssignments.filter((a) => a !== null);
  },
});

// ====================
// MUTATIONS
// ====================

/**
 * Create an assignment
 */
export const createAssignment = mutation({
  args: {
    classroomId: v.id("classrooms"),
    teacherId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    wordIds: v.array(v.id("wordLibrary")),
    phonicsGroupFocus: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    targetAccuracy: v.optional(v.number()),
    minimumAttempts: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify classroom exists and teacher owns it
    const classroom = await ctx.db.get(args.classroomId);
    if (!classroom) {
      throw new Error("Classroom not found");
    }

    if (classroom.teacherId !== args.teacherId) {
      throw new Error("Only classroom teacher can create assignments");
    }

    const now = Date.now();

    // Create assignment
    const assignmentId = await ctx.db.insert("assignments", {
      classroomId: args.classroomId,
      teacherId: args.teacherId,
      title: args.title,
      description: args.description,
      wordIds: args.wordIds,
      phonicsGroupFocus: args.phonicsGroupFocus,
      assignedAt: now,
      dueDate: args.dueDate,
      targetAccuracy: args.targetAccuracy,
      minimumAttempts: args.minimumAttempts,
      isActive: true,
      createdAt: now,
    });

    // Create studentAssignment entries for all students in classroom
    await Promise.all(
      classroom.studentIds.map((studentId) =>
        ctx.db.insert("studentAssignments", {
          studentId,
          assignmentId,
          classroomId: args.classroomId,
          status: "not_started",
          totalAttempts: 0,
          timeSpent: 0,
          createdAt: now,
        })
      )
    );

    return assignmentId;
  },
});

/**
 * Update assignment
 */
export const updateAssignment = mutation({
  args: {
    assignmentId: v.id("assignments"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    wordIds: v.optional(v.array(v.id("wordLibrary"))),
    phonicsGroupFocus: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    targetAccuracy: v.optional(v.number()),
    minimumAttempts: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { assignmentId, ...updates }) => {
    const assignment = await ctx.db.get(assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // TODO: Verify caller is the assignment teacher

    await ctx.db.patch(assignmentId, updates);
    return assignmentId;
  },
});

/**
 * Update assignment active status
 */
export const updateAssignmentStatus = mutation({
  args: {
    assignmentId: v.id("assignments"),
    isActive: v.boolean(),
  },
  handler: async (ctx, { assignmentId, isActive }) => {
    const assignment = await ctx.db.get(assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // TODO: Verify caller is the assignment teacher

    await ctx.db.patch(assignmentId, { isActive });
    return { success: true };
  },
});

/**
 * Update student assignment progress
 * Called after a practice session with this assignment
 */
export const updateStudentAssignmentProgress = mutation({
  args: {
    studentId: v.id("users"),
    assignmentId: v.id("assignments"),
    accuracy: v.number(),
    timeSpent: v.number(), // Seconds
  },
  handler: async (ctx, { studentId, assignmentId, accuracy, timeSpent }) => {
    const studentAssignment = await ctx.db
      .query("studentAssignments")
      .withIndex("by_student_assignment", (q) =>
        q.eq("studentId", studentId).eq("assignmentId", assignmentId)
      )
      .first();

    if (!studentAssignment) {
      throw new Error("Student assignment not found");
    }

    // Get assignment requirements
    const assignment = await ctx.db.get(assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // Update progress
    const newTotalAttempts = studentAssignment.totalAttempts + 1;
    const newTimeSpent = studentAssignment.timeSpent + timeSpent;
    const newBestAccuracy = studentAssignment.bestAccuracy
      ? Math.max(studentAssignment.bestAccuracy, accuracy)
      : accuracy;

    let newStatus = studentAssignment.status;
    if (newStatus === "not_started") {
      newStatus = "in_progress";
    }

    // Check if completed
    const meetsAccuracy = assignment.targetAccuracy
      ? newBestAccuracy >= assignment.targetAccuracy
      : true;
    const meetsAttempts = assignment.minimumAttempts
      ? newTotalAttempts >= assignment.minimumAttempts
      : true;

    if (meetsAccuracy && meetsAttempts) {
      newStatus = "completed";
    }

    await ctx.db.patch(studentAssignment._id, {
      status: newStatus,
      bestAccuracy: newBestAccuracy,
      totalAttempts: newTotalAttempts,
      timeSpent: newTimeSpent,
      completedAt: newStatus === "completed" ? Date.now() : undefined,
    });

    return {
      status: newStatus,
      progress: {
        bestAccuracy: newBestAccuracy,
        totalAttempts: newTotalAttempts,
        timeSpent: newTimeSpent,
      },
    };
  },
});

/**
 * Delete assignment
 */
export const deleteAssignment = mutation({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, { assignmentId }) => {
    const assignment = await ctx.db.get(assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // TODO: Verify caller is the assignment teacher

    // Delete all student assignment entries
    const studentAssignments = await ctx.db
      .query("studentAssignments")
      .withIndex("by_assignmentId", (q) => q.eq("assignmentId", assignmentId))
      .collect();

    await Promise.all(
      studentAssignments.map((sa) => ctx.db.delete(sa._id))
    );

    // Delete assignment
    await ctx.db.delete(assignmentId);

    return { success: true };
  },
});

/**
 * Get assignment completion stats
 */
export const getAssignmentStats = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, { assignmentId }) => {
    const studentAssignments = await ctx.db
      .query("studentAssignments")
      .withIndex("by_assignmentId", (q) => q.eq("assignmentId", assignmentId))
      .collect();

    const total = studentAssignments.length;
    const notStarted = studentAssignments.filter(
      (sa) => sa.status === "not_started"
    ).length;
    const inProgress = studentAssignments.filter(
      (sa) => sa.status === "in_progress"
    ).length;
    const completed = studentAssignments.filter(
      (sa) => sa.status === "completed"
    ).length;

    const avgAccuracy =
      studentAssignments.filter((sa) => sa.bestAccuracy).length > 0
        ? studentAssignments.reduce(
            (sum, sa) => sum + (sa.bestAccuracy || 0),
            0
          ) / studentAssignments.filter((sa) => sa.bestAccuracy).length
        : 0;

    return {
      total,
      notStarted,
      inProgress,
      completed,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      averageAccuracy: Math.round(avgAccuracy * 100) / 100,
    };
  },
});
