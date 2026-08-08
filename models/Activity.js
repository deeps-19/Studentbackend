const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },

    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
    },

    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
    },

    type: {
      type: String,
      enum: [
        "LESSON_STARTED",
        "LESSON_COMPLETED",
        "COURSE_STARTED",
        "COURSE_COMPLETED",
        "QUIZ_COMPLETED",
        "LEARNING_SESSION",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    timeSpent: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Activity", activitySchema);