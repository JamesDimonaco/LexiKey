import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Classroom Management Functions (B2B Features)
 *
 * Handles teacher-student relationships and classroom organization
 */

// ====================
// QUERIES
// ====================

/**
 * Get all classrooms for a teacher
 */
export const getTeacherClassrooms = query({
  args: { teacherId: v.id("users") },
  handler: async (ctx, { teacherId }) => {
    const classrooms = await ctx.db
      .query("classrooms")
      .withIndex("by_teacherId", (q) => q.eq("teacherId", teacherId))
      .collect();

    return classrooms;
  },
});

/**
 * Get classroom details with student information
 */
export const getClassroomDetails = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, { classroomId }) => {
    const classroom = await ctx.db.get(classroomId);
    if (!classroom) {
      throw new Error("Classroom not found");
    }

    // Get student details
    const students = await Promise.all(
      classroom.studentIds.map(async (studentId) => {
        const student = await ctx.db.get(studentId);
        return student;
      })
    );

    return {
      ...classroom,
      students: students.filter((s) => s !== null),
    };
  },
});

/**
 * Get all classrooms a student belongs to
 */
export const getStudentClassrooms = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, { studentId }) => {
    const allClassrooms = await ctx.db.query("classrooms").collect();

    // Filter classrooms where student is enrolled
    const studentClassrooms = allClassrooms.filter((classroom) =>
      classroom.studentIds.includes(studentId)
    );

    return studentClassrooms;
  },
});

/**
 * Get classroom by ID
 */
export const getClassroomById = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, { classroomId }) => {
    return await ctx.db.get(classroomId);
  },
});

/**
 * Check if student is in classroom
 */
export const isStudentInClassroom = query({
  args: {
    studentId: v.id("users"),
    classroomId: v.id("classrooms"),
  },
  handler: async (ctx, { studentId, classroomId }) => {
    const classroom = await ctx.db.get(classroomId);
    if (!classroom) {
      return false;
    }

    return classroom.studentIds.includes(studentId);
  },
});

/**
 * Get classroom student count
 */
export const getClassroomStudentCount = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, { classroomId }) => {
    const classroom = await ctx.db.get(classroomId);
    if (!classroom) {
      return 0;
    }

    return classroom.studentIds.length;
  },
});

// ====================
// MUTATIONS
// ====================

/**
 * Create a new classroom
 */
export const createClassroom = mutation({
  args: {
    teacherId: v.id("users"),
    name: v.string(),
    gradeLevel: v.optional(v.string()),
    schoolName: v.optional(v.string()),
    settings: v.optional(
      v.object({
        defaultPhonicsFocus: v.optional(v.string()),
        defaultDifficulty: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Verify user is a teacher
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) {
      throw new Error("Teacher not found");
    }

    if (teacher.role !== "teacher") {
      throw new Error("Only teachers can create classrooms");
    }

    const now = Date.now();

    const classroomId = await ctx.db.insert("classrooms", {
      teacherId: args.teacherId,
      name: args.name,
      gradeLevel: args.gradeLevel,
      schoolName: args.schoolName,
      studentIds: [],
      settings: args.settings,
      createdAt: now,
      updatedAt: now,
    });

    return classroomId;
  },
});

/**
 * Update classroom details
 */
export const updateClassroom = mutation({
  args: {
    classroomId: v.id("classrooms"),
    name: v.optional(v.string()),
    gradeLevel: v.optional(v.string()),
    schoolName: v.optional(v.string()),
    settings: v.optional(
      v.object({
        defaultPhonicsFocus: v.optional(v.string()),
        defaultDifficulty: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { classroomId, ...updates }) => {
    const classroom = await ctx.db.get(classroomId);
    if (!classroom) {
      throw new Error("Classroom not found");
    }

    // TODO: Verify caller is the classroom teacher

    await ctx.db.patch(classroomId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return classroomId;
  },
});

/**
 * Add a single student to classroom
 */
export const addStudentToClassroom = mutation({
  args: {
    classroomId: v.id("classrooms"),
    studentId: v.id("users"),
  },
  handler: async (ctx, { classroomId, studentId }) => {
    const classroom = await ctx.db.get(classroomId);
    if (!classroom) {
      throw new Error("Classroom not found");
    }

    const student = await ctx.db.get(studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    if (student.role !== "student") {
      throw new Error("User is not a student");
    }

    // TODO: Verify caller is the classroom teacher

    // Check if student already in classroom
    if (classroom.studentIds.includes(studentId)) {
      return { success: false, message: "Student already in classroom" };
    }

    // Add student
    await ctx.db.patch(classroomId, {
      studentIds: [...classroom.studentIds, studentId],
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Add multiple students to classroom
 */
export const addStudentsToClassroom = mutation({
  args: {
    classroomId: v.id("classrooms"),
    studentIds: v.array(v.id("users")),
  },
  handler: async (ctx, { classroomId, studentIds }) => {
    const classroom = await ctx.db.get(classroomId);
    if (!classroom) {
      throw new Error("Classroom not found");
    }

    // TODO: Verify caller is the classroom teacher
    // TODO: Verify all users are students

    // Filter out students already in classroom
    const newStudents = studentIds.filter(
      (id) => !classroom.studentIds.includes(id)
    );

    if (newStudents.length === 0) {
      return { success: false, message: "All students already in classroom" };
    }

    await ctx.db.patch(classroomId, {
      studentIds: [...classroom.studentIds, ...newStudents],
      updatedAt: Date.now(),
    });

    return { success: true, count: newStudents.length };
  },
});

/**
 * Remove student from classroom
 */
export const removeStudentFromClassroom = mutation({
  args: {
    classroomId: v.id("classrooms"),
    studentId: v.id("users"),
  },
  handler: async (ctx, { classroomId, studentId }) => {
    const classroom = await ctx.db.get(classroomId);
    if (!classroom) {
      throw new Error("Classroom not found");
    }

    // TODO: Verify caller is the classroom teacher

    const updatedStudents = classroom.studentIds.filter((id) => id !== studentId);

    await ctx.db.patch(classroomId, {
      studentIds: updatedStudents,
      updatedAt: Date.now(),
    });

    // TODO: Optionally handle assignment cleanup for removed student

    return { success: true };
  },
});

/**
 * Delete classroom
 */
export const deleteClassroom = mutation({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, { classroomId }) => {
    const classroom = await ctx.db.get(classroomId);
    if (!classroom) {
      throw new Error("Classroom not found");
    }

    // TODO: Verify caller is the classroom teacher
    // TODO: Handle cleanup of related assignments

    await ctx.db.delete(classroomId);
    return { success: true };
  },
});

/**
 * Get classroom statistics
 */
export const getClassroomStats = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, { classroomId }) => {
    const classroom = await ctx.db.get(classroomId);
    if (!classroom) {
      throw new Error("Classroom not found");
    }

    // Get all student sessions
    const sessions = await Promise.all(
      classroom.studentIds.map(async (studentId) => {
        return await ctx.db
          .query("practiceSessions")
          .withIndex("by_userId", (q) => q.eq("userId", studentId))
          .collect();
      })
    );

    const allSessions = sessions.flat();

    // Calculate aggregate stats
    const totalSessions = allSessions.length;
    const totalWords = allSessions.reduce((sum, s) => sum + s.wordsAttempted, 0);
    const averageAccuracy =
      totalSessions > 0
        ? allSessions.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions
        : 0;

    // Get per-student stats
    const studentStats = await Promise.all(
      classroom.studentIds.map(async (studentId) => {
        const student = await ctx.db.get(studentId);
        return {
          studentId,
          studentName: student?.name || "Unknown",
          ...student?.stats,
        };
      })
    );

    return {
      totalStudents: classroom.studentIds.length,
      totalSessions,
      totalWords,
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      studentStats,
    };
  },
});
