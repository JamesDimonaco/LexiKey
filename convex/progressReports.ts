import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";

/**
 * Progress Reports (IEP Generator - B2B Killer Feature)
 *
 * Generates comprehensive reports for teachers to document student progress
 * Saves teachers hours of paperwork for IEP documentation
 */

// ====================
// QUERIES
// ====================

/**
 * Get all reports for a student
 */
export const getStudentReports = query({
  args: {
    studentId: v.id("users"),
    reportType: v.optional(
      v.union(
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("custom"),
        v.literal("iep")
      )
    ),
  },
  handler: async (ctx, { studentId, reportType }) => {
    let query = ctx.db
      .query("progressReports")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId));

    const reports = await query.collect();

    if (reportType) {
      return reports.filter((r) => r.reportType === reportType);
    }

    return reports;
  },
});

/**
 * Get all reports created by a teacher
 */
export const getTeacherReports = query({
  args: { teacherId: v.id("users") },
  handler: async (ctx, { teacherId }) => {
    const reports = await ctx.db
      .query("progressReports")
      .withIndex("by_teacherId", (q) => q.eq("teacherId", teacherId))
      .collect();

    // Join with student details
    const reportsWithStudents = await Promise.all(
      reports.map(async (report) => {
        const student = await ctx.db.get(report.studentId);
        return {
          ...report,
          studentName: student?.name || "Unknown",
        };
      })
    );

    return reportsWithStudents;
  },
});

/**
 * Get report by ID
 */
export const getReportById = query({
  args: { reportId: v.id("progressReports") },
  handler: async (ctx, { reportId }) => {
    const report = await ctx.db.get(reportId);
    if (!report) {
      return null;
    }

    // Join with student and teacher details
    const student = await ctx.db.get(report.studentId);
    const teacher = report.teacherId
      ? await ctx.db.get(report.teacherId)
      : null;

    return {
      ...report,
      studentName: student?.name || "Unknown",
      teacherName: teacher?.name || "Unknown",
    };
  },
});

// ====================
// MUTATIONS
// ====================

/**
 * Generate a progress report
 */
export const generateProgressReport = mutation({
  args: {
    studentId: v.id("users"),
    teacherId: v.optional(v.id("users")),
    reportType: v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("custom"),
      v.literal("iep")
    ),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Get all sessions in date range
    const sessions = await ctx.db
      .query("practiceSessions")
      .withIndex("by_userId_timestamp", (q) => q.eq("userId", args.studentId))
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), args.startDate),
          q.lte(q.field("timestamp"), args.endDate)
        )
      )
      .collect();

    // Calculate aggregate statistics
    const totalSessions = sessions.length;
    const totalWords = sessions.reduce((sum, s) => sum + s.wordsAttempted, 0);

    const accuracies = sessions.map((s) => s.accuracy);
    const averageAccuracy =
      accuracies.length > 0
        ? accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
        : 0;

    // Calculate improvement rate (compare first half vs second half)
    const midpoint = Math.floor(sessions.length / 2);
    const firstHalf = sessions.slice(0, midpoint);
    const secondHalf = sessions.slice(midpoint);

    const firstHalfAvg =
      firstHalf.length > 0
        ? firstHalf.reduce((sum, s) => sum + s.accuracy, 0) / firstHalf.length
        : 0;
    const secondHalfAvg =
      secondHalf.length > 0
        ? secondHalf.reduce((sum, s) => sum + s.accuracy, 0) / secondHalf.length
        : 0;

    const improvementRate =
      firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

    // Group by phonics for detailed breakdown
    const phonicsGroupMap: Record<
      string,
      { wordsAttempted: number; accuracy: number; count: number }
    > = {};

    sessions.forEach((session) => {
      if (session.phonicsGroupFocus) {
        if (!phonicsGroupMap[session.phonicsGroupFocus]) {
          phonicsGroupMap[session.phonicsGroupFocus] = {
            wordsAttempted: 0,
            accuracy: 0,
            count: 0,
          };
        }

        phonicsGroupMap[session.phonicsGroupFocus].wordsAttempted +=
          session.wordsAttempted;
        phonicsGroupMap[session.phonicsGroupFocus].accuracy += session.accuracy;
        phonicsGroupMap[session.phonicsGroupFocus].count += 1;
      }
    });

    const phonicsGroupsProgress = Object.entries(phonicsGroupMap).map(
      ([group, stats]) => ({
        group,
        accuracy: stats.accuracy / stats.count,
        wordsAttempted: stats.wordsAttempted,
      })
    );

    // Identify struggling areas (accuracy < 70%)
    const strugglingAreas = phonicsGroupsProgress
      .filter((pg) => pg.accuracy < 70)
      .map((pg) => pg.group);

    // Identify strengths (accuracy >= 85%)
    const strengths = phonicsGroupsProgress
      .filter((pg) => pg.accuracy >= 85)
      .map((pg) => pg.group);

    // Create report
    const reportId = await ctx.db.insert("progressReports", {
      studentId: args.studentId,
      teacherId: args.teacherId,
      reportType: args.reportType,
      startDate: args.startDate,
      endDate: args.endDate,
      summary: {
        totalSessions,
        totalWords,
        averageAccuracy: Math.round(averageAccuracy * 100) / 100,
        improvementRate: Math.round(improvementRate * 100) / 100,
        phonicsGroupsProgress,
        strugglingAreas,
        strengths,
      },
      createdAt: Date.now(),
    });

    return reportId;
  },
});

/**
 * Delete a report
 */
export const deleteReport = mutation({
  args: { reportId: v.id("progressReports") },
  handler: async (ctx, { reportId }) => {
    const report = await ctx.db.get(reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    // TODO: Verify caller is the report teacher or admin

    await ctx.db.delete(reportId);
    return { success: true };
  },
});

/**
 * Update report PDF URL (after generation)
 */
export const updateReportPdfUrl = mutation({
  args: {
    reportId: v.id("progressReports"),
    pdfUrl: v.string(),
  },
  handler: async (ctx, { reportId, pdfUrl }) => {
    const report = await ctx.db.get(reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    await ctx.db.patch(reportId, { pdfUrl });
    return { success: true };
  },
});

// ====================
// ACTIONS
// ====================

/**
 * Generate PDF for a report
 * This is an action (not mutation) because it calls external services
 */
export const generateReportPDF = action({
  args: { reportId: v.id("progressReports") },
  handler: async (ctx, { reportId }) => {
    // Fetch report data
    const report = await ctx.runQuery(
      ctx.db.system.getFunctionId("progressReports:getReportById"),
      { reportId }
    );

    if (!report) {
      throw new Error("Report not found");
    }

    // TODO: Implement PDF generation
    // Options:
    // 1. Use Puppeteer to render HTML to PDF
    // 2. Use PDFKit to generate PDF programmatically
    // 3. Use external service like DocRaptor or PDFShift

    // For now, return placeholder
    const placeholderPdfUrl = `https://placeholder.com/report-${reportId}.pdf`;

    // Update report with PDF URL
    await ctx.runMutation(
      ctx.db.system.getFunctionId("progressReports:updateReportPdfUrl"),
      {
        reportId,
        pdfUrl: placeholderPdfUrl,
      }
    );

    return { pdfUrl: placeholderPdfUrl };
  },
});

/**
 * Generate quick weekly report for a student
 * Convenience function for common use case
 */
export const generateWeeklyReport = mutation({
  args: {
    studentId: v.id("users"),
    teacherId: v.optional(v.id("users")),
  },
  handler: async (ctx, { studentId, teacherId }) => {
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    return await ctx.runMutation(
      ctx.db.system.getFunctionId("progressReports:generateProgressReport"),
      {
        studentId,
        teacherId,
        reportType: "weekly",
        startDate: oneWeekAgo,
        endDate: now,
      }
    );
  },
});

/**
 * Generate quick monthly report for a student
 * Convenience function for common use case
 */
export const generateMonthlyReport = mutation({
  args: {
    studentId: v.id("users"),
    teacherId: v.optional(v.id("users")),
  },
  handler: async (ctx, { studentId, teacherId }) => {
    const now = Date.now();
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    return await ctx.runMutation(
      ctx.db.system.getFunctionId("progressReports:generateProgressReport"),
      {
        studentId,
        teacherId,
        reportType: "monthly",
        startDate: oneMonthAgo,
        endDate: now,
      }
    );
  },
});

/**
 * Get report template data for IEP generation
 * Provides structured data for PDF generation
 */
export const getIEPReportData = query({
  args: { reportId: v.id("progressReports") },
  handler: async (ctx, { reportId }) => {
    const report = await ctx.db.get(reportId);
    if (!report || report.reportType !== "iep") {
      throw new Error("IEP report not found");
    }

    // Get student details
    const student = await ctx.db.get(report.studentId);
    const teacher = report.teacherId
      ? await ctx.db.get(report.teacherId)
      : null;

    // Format data for IEP template
    return {
      studentInfo: {
        name: student?.name || "Unknown",
        email: student?.email,
      },
      teacherInfo: {
        name: teacher?.name || "Unknown",
        email: teacher?.email,
      },
      dateRange: {
        start: new Date(report.startDate).toLocaleDateString(),
        end: new Date(report.endDate).toLocaleDateString(),
      },
      summary: report.summary,
      recommendations: generateRecommendations(report.summary),
    };
  },
});

// ====================
// HELPER FUNCTIONS
// ====================

/**
 * Generate recommendations based on report data
 */
function generateRecommendations(summary: any): string[] {
  const recommendations: string[] = [];

  // Accuracy-based recommendations
  if (summary.averageAccuracy < 60) {
    recommendations.push(
      "Consider slowing down practice pace and focusing on accuracy over speed."
    );
  }

  // Improvement rate recommendations
  if (summary.improvementRate < 0) {
    recommendations.push(
      "Student may be experiencing difficulty. Recommend additional support or review of foundational skills."
    );
  } else if (summary.improvementRate > 20) {
    recommendations.push(
      "Excellent progress! Consider advancing to more challenging phonics groups."
    );
  }

  // Struggling areas recommendations
  if (summary.strugglingAreas.length > 0) {
    recommendations.push(
      `Focus additional practice on: ${summary.strugglingAreas.join(", ")}`
    );
  }

  // Strengths recommendations
  if (summary.strengths.length > 0) {
    recommendations.push(
      `Continue reinforcing strong areas: ${summary.strengths.join(", ")}`
    );
  }

  // Session frequency recommendations
  if (summary.totalSessions < 3) {
    recommendations.push(
      "Increase practice frequency to at least 3-5 sessions per week for optimal progress."
    );
  }

  return recommendations;
}
