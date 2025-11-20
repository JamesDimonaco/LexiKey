# LexiKey Convex Functions Architecture

This document outlines the Convex queries, mutations, and actions needed for LexiKey.

## Core Principles

1. **Local-First Validation**: Typing logic happens in browser, only results sent to DB
2. **Optimized Reads**: Use indexes efficiently for fast queries
3. **Minimal Writes**: Session summaries only, never individual keystrokes
4. **Real-time Updates**: Leverage Convex's reactivity for teacher dashboards

---

## 1. User Management

### Queries

```typescript
// users.ts

export const getCurrentUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    // Get user by Clerk ID
    // Returns full user object with settings and stats
  }
});

export const getUsersByRole = query({
  args: { role: v.union(v.literal("student"), v.literal("teacher"), v.literal("parent")) },
  handler: async (ctx, { role }) => {
    // Get all users of a specific role
    // Useful for admin dashboards
  }
});
```

### Mutations

```typescript
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    role: v.union(v.literal("student"), v.literal("teacher"), v.literal("parent")),
  },
  handler: async (ctx, args) => {
    // Create user with default settings
    // Initialize stats to zeros
    // Return user ID
  }
});

export const updateUserSettings = mutation({
  args: {
    userId: v.id("users"),
    settings: v.object({
      font: v.optional(v.string()),
      fontSize: v.optional(v.number()),
      letterSpacing: v.optional(v.number()),
      contrast: v.optional(v.union(v.literal("normal"), v.literal("high"))),
      voiceSpeed: v.optional(v.number()),
      ttsEnabled: v.optional(v.boolean()),
      showHints: v.optional(v.boolean()),
      timerPressure: v.optional(v.boolean()),
      blindMode: v.optional(v.boolean()),
      cursorStyle: v.optional(v.union(
        v.literal("standard"),
        v.literal("large"),
        v.literal("non-blinking")
      )),
    }),
  },
  handler: async (ctx, { userId, settings }) => {
    // Merge settings with existing
    // Update updatedAt timestamp
  }
});

export const updateUserStats = mutation({
  args: {
    userId: v.id("users"),
    stats: v.object({
      totalWords: v.optional(v.number()),
      totalSessions: v.optional(v.number()),
      currentStreak: v.optional(v.number()),
      longestStreak: v.optional(v.number()),
      lastPracticeDate: v.optional(v.string()),
      totalMinutesPracticed: v.optional(v.number()),
      averageAccuracy: v.optional(v.number()),
    }),
  },
  handler: async (ctx, { userId, stats }) => {
    // Update user statistics
    // Calculate streaks based on lastPracticeDate
  }
});
```

---

## 2. Word Library

### Queries

```typescript
// wordLibrary.ts

export const getWordsByPhonicsGroup = query({
  args: {
    phonicsGroup: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { phonicsGroup, limit = 20 }) => {
    // Get words filtered by phonics group
    // Use index: by_phonicsGroup
    // Limit results for performance
  }
});

export const getWordsByDifficulty = query({
  args: {
    difficultyLevel: v.number(),
    phonicsGroup: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { difficultyLevel, phonicsGroup, limit = 20 }) => {
    // Get words by difficulty, optionally filtered by phonics
    // Use index: by_difficulty
  }
});

export const searchWords = query({
  args: {
    searchTerm: v.string(),
    phonicsGroup: v.optional(v.string()),
    difficultyLevel: v.optional(v.number()),
  },
  handler: async (ctx, { searchTerm, phonicsGroup, difficultyLevel }) => {
    // Use search index to find words
    // Useful for teacher creating custom lists
  }
});

export const getCustomWordsByTeacher = query({
  args: { teacherId: v.id("users") },
  handler: async (ctx, { teacherId }) => {
    // Get all custom words uploaded by a specific teacher
    // Use index: by_createdBy
  }
});
```

### Mutations

```typescript
export const addWord = mutation({
  args: {
    word: v.string(),
    phonicsGroup: v.string(),
    phonicsSubgroup: v.optional(v.string()),
    difficultyLevel: v.number(),
    sentenceContext: v.optional(v.string()),
    tags: v.array(v.string()),
    isCustom: v.boolean(),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Add word to library
    // Calculate letterCount automatically
    // Set createdAt timestamp
  }
});

export const bulkAddWords = mutation({
  args: {
    words: v.array(v.object({
      word: v.string(),
      phonicsGroup: v.string(),
      difficultyLevel: v.number(),
      sentenceContext: v.optional(v.string()),
      tags: v.array(v.string()),
    })),
    isCustom: v.boolean(),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, { words, isCustom, createdBy }) => {
    // Bulk insert words (for seeding or teacher CSV upload)
    // Use Promise.all for efficiency
  }
});

export const deleteWord = mutation({
  args: { wordId: v.id("wordLibrary") },
  handler: async (ctx, { wordId }) => {
    // Delete word (only if custom and created by current user)
    // Check permissions
  }
});
```

---

## 3. Practice Sessions

### Queries

```typescript
// practiceSessions.ts

export const getUserSessions = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 50 }) => {
    // Get recent sessions for a user
    // Use index: by_userId_timestamp
    // Order by timestamp DESC
  }
});

export const getSessionsByDateRange = query({
  args: {
    userId: v.id("users"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, { userId, startDate, endDate }) => {
    // Get sessions within date range
    // Used for progress reports
  }
});

export const getSessionStats = query({
  args: {
    userId: v.id("users"),
    phonicsGroup: v.optional(v.string()),
  },
  handler: async (ctx, { userId, phonicsGroup }) => {
    // Calculate aggregate stats
    // Total words, average accuracy, total time
    // Filter by phonics group if provided
  }
});
```

### Mutations

```typescript
export const createPracticeSession = mutation({
  args: {
    userId: v.id("users"),
    mode: v.union(
      v.literal("lesson"),
      v.literal("practice"),
      v.literal("assignment"),
      v.literal("review")
    ),
    phonicsGroupFocus: v.optional(v.string()),
    assignmentId: v.optional(v.id("assignments")),
    wordsAttempted: v.number(),
    wordsCompleted: v.number(),
    accuracy: v.number(),
    averageWPM: v.optional(v.number()),
    durationSeconds: v.number(),
    struggleWords: v.array(v.id("wordLibrary")),
    wordResults: v.array(v.object({
      wordId: v.id("wordLibrary"),
      word: v.string(),
      timeSpent: v.number(),
      backspaceCount: v.number(),
      wasCorrect: v.boolean(),
      hesitationDetected: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    // Create session summary
    // DO NOT store individual keystrokes!
    // Update user stats (totalWords, totalSessions, etc.)
    // Add struggleWords to userStruggleWords table
    // Update student assignment progress if assignmentId present
  }
});
```

---

## 4. Struggle Words (Bucket System)

### Queries

```typescript
// struggleWords.ts

export const getUserStruggleWords = query({
  args: {
    userId: v.id("users"),
    status: v.optional(v.union(
      v.literal("struggling"),
      v.literal("improving"),
      v.literal("mastered")
    )),
  },
  handler: async (ctx, { userId, status }) => {
    // Get struggle words for user
    // Filter by status if provided
    // Join with wordLibrary to get word details
  }
});

export const getWordsForReview = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // Get words due for review (nextReviewAt <= now)
    // Use index: by_userId_nextReview
    // Implement spaced repetition logic
  }
});
```

### Mutations

```typescript
export const addToStruggleBucket = mutation({
  args: {
    userId: v.id("users"),
    wordId: v.id("wordLibrary"),
  },
  handler: async (ctx, { userId, wordId }) => {
    // Check if word already in bucket
    // If exists, increment errorCount
    // If new, create entry with initial values
    // Set nextReviewAt based on SM-2 algorithm
  }
});

export const updateStruggleWordProgress = mutation({
  args: {
    userId: v.id("users"),
    wordId: v.id("wordLibrary"),
    wasSuccessful: v.boolean(),
  },
  handler: async (ctx, { userId, wordId, wasSuccessful }) => {
    // Update spaced repetition schedule
    // Adjust easeFactor and interval
    // Update status (struggling -> improving -> mastered)
    // If mastered (3+ successes), consider removing from bucket
  }
});
```

---

## 5. Classroom Management (B2B)

### Queries

```typescript
// classrooms.ts

export const getTeacherClassrooms = query({
  args: { teacherId: v.id("users") },
  handler: async (ctx, { teacherId }) => {
    // Get all classrooms for a teacher
    // Use index: by_teacherId
  }
});

export const getClassroomDetails = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, { classroomId }) => {
    // Get classroom with student details
    // Join with users table for student info
  }
});

export const getStudentClassrooms = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, { studentId }) => {
    // Find all classrooms student belongs to
    // Filter classrooms where studentIds includes studentId
  }
});
```

### Mutations

```typescript
export const createClassroom = mutation({
  args: {
    teacherId: v.id("users"),
    name: v.string(),
    gradeLevel: v.optional(v.string()),
    schoolName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify user is a teacher
    // Create classroom with empty studentIds
    // Return classroom ID
  }
});

export const addStudentsToClassroom = mutation({
  args: {
    classroomId: v.id("classrooms"),
    studentIds: v.array(v.id("users")),
  },
  handler: async (ctx, { classroomId, studentIds }) => {
    // Verify caller is the classroom teacher
    // Add students to classroom.studentIds
    // Check for duplicates
  }
});

export const removeStudentFromClassroom = mutation({
  args: {
    classroomId: v.id("classrooms"),
    studentId: v.id("users"),
  },
  handler: async (ctx, { classroomId, studentId }) => {
    // Verify caller is the classroom teacher
    // Remove student from classroom.studentIds
  }
});
```

---

## 6. Assignments (B2B)

### Queries

```typescript
// assignments.ts

export const getClassroomAssignments = query({
  args: {
    classroomId: v.id("classrooms"),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { classroomId, isActive }) => {
    // Get assignments for a classroom
    // Filter by isActive if provided
    // Use index: by_classroomId
  }
});

export const getStudentAssignments = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, { studentId }) => {
    // Get all assignments for a student
    // Join with studentAssignments for completion status
    // Use index: by_studentId
  }
});

export const getAssignmentProgress = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, { assignmentId }) => {
    // Get all student progress for an assignment
    // Teacher dashboard view
    // Join studentAssignments with users
  }
});
```

### Mutations

```typescript
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
    // Create assignment
    // Create studentAssignments entries for all students in classroom
    // Set isActive to true
  }
});

export const updateAssignmentStatus = mutation({
  args: {
    assignmentId: v.id("assignments"),
    isActive: v.boolean(),
  },
  handler: async (ctx, { assignmentId, isActive }) => {
    // Deactivate or reactivate assignment
    // Only teacher can modify
  }
});

export const updateStudentAssignmentProgress = mutation({
  args: {
    studentId: v.id("users"),
    assignmentId: v.id("assignments"),
    accuracy: v.number(),
    timeSpent: v.number(),
  },
  handler: async (ctx, { studentId, assignmentId, accuracy, timeSpent }) => {
    // Update student progress on assignment
    // Update bestAccuracy if new score is higher
    // Increment totalAttempts
    // Mark as completed if meets requirements
  }
});
```

---

## 7. Progress Reports (IEP Generator - B2B Killer Feature)

### Queries

```typescript
// progressReports.ts

export const getStudentReports = query({
  args: {
    studentId: v.id("users"),
    reportType: v.optional(v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("custom"),
      v.literal("iep")
    )),
  },
  handler: async (ctx, { studentId, reportType }) => {
    // Get all reports for a student
    // Filter by type if provided
    // Use index: by_studentId
  }
});

export const getTeacherReports = query({
  args: { teacherId: v.id("users") },
  handler: async (ctx, { teacherId }) => {
    // Get all reports created by teacher
    // For all their students
  }
});
```

### Mutations & Actions

```typescript
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
    // Query practiceSessions for date range
    // Aggregate data:
    //   - Total sessions, words, accuracy
    //   - Group by phonicsGroup for breakdown
    //   - Calculate improvement rate
    //   - Identify struggling areas (low accuracy groups)
    //   - Identify strengths (high accuracy groups)
    // Create progressReport entry
    // Return report ID
  }
});

// Action for PDF generation (uses external service)
export const generateReportPDF = action({
  args: { reportId: v.id("progressReports") },
  handler: async (ctx, { reportId }) => {
    // Fetch report data
    // Call PDF generation service (e.g., Puppeteer, PDFKit)
    // Upload PDF to storage (e.g., Convex file storage)
    // Update report with pdfUrl
    // Return PDF URL
  }
});
```

---

## Implementation Priority

### Phase 1 - MVP (Core Functionality)
1. ✅ User management (create, read, update)
2. ✅ Word library queries (by phonics, difficulty)
3. ✅ Practice session creation
4. ✅ Struggle word tracking

### Phase 2 - B2B Features
5. Classroom management
6. Assignment system
7. Student assignment tracking

### Phase 3 - B2B Killer Feature
8. Progress report generation
9. IEP report PDF generation

---

## Performance Considerations

### Indexing Strategy
- **Critical indexes** (high-frequency reads):
  - `users.by_clerkId` - Authentication
  - `wordLibrary.by_phonicsGroup` - Lesson generation
  - `practiceSessions.by_userId_timestamp` - User history
  - `userStruggleWords.by_userId_nextReview` - Spaced repetition

- **Optimization**:
  - Use `limit` on all queries to prevent full table scans
  - Denormalize word text in `practiceSessions.wordResults` for fast reporting
  - Aggregate data in `progressReports` instead of querying sessions repeatedly

### Write Optimization
- **NEVER** write individual keystrokes
- Batch session results into single mutation
- Update user stats atomically with session creation
- Use background jobs for heavy aggregations (reports)

---

## Security & Permissions

All mutations should validate:
1. **User identity**: Check `ctx.auth.getUserIdentity()`
2. **Role permissions**:
   - Students can only modify their own data
   - Teachers can only access their classrooms/students
   - Parents can only access their children's data
3. **Ownership**: Verify classroom.teacherId matches caller for teacher actions

Example:
```typescript
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Unauthorized");

const user = await ctx.db
  .query("users")
  .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
  .first();

if (!user || user.role !== "teacher") {
  throw new Error("Only teachers can create assignments");
}
```

---

## Next Steps

1. Implement Phase 1 functions (MVP)
2. Seed word library with phonics-categorized words
3. Build frontend typing engine (local validation)
4. Test session creation and struggle word tracking
5. Add B2B features (Phase 2)
6. Build IEP report generator (Phase 3)

---

## Linear Tickets (To Be Created)

### Backend (Convex Functions)
- [ ] **LK-1**: Implement user management functions (CRUD)
- [ ] **LK-2**: Implement word library queries and mutations
- [ ] **LK-3**: Implement practice session creation and queries
- [ ] **LK-4**: Implement struggle word bucket system (spaced repetition)
- [ ] **LK-5**: Implement classroom management functions
- [ ] **LK-6**: Implement assignment system
- [ ] **LK-7**: Implement progress report generation
- [ ] **LK-8**: Implement IEP PDF generation (Action)

### Data Seeding
- [ ] **LK-9**: Create phonics-based word seed data (CVC, Silent E, Digraphs, etc.)
- [ ] **LK-10**: Bulk import initial word library

### Frontend Integration
- [ ] **LK-11**: Connect TypingEngine to practice session mutations
- [ ] **LK-12**: Build teacher dashboard (classroom view)
- [ ] **LK-13**: Build assignment creation UI
- [ ] **LK-14**: Build student assignment view
- [ ] **LK-15**: Build IEP report generator UI
