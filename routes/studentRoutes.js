const express = require("express");

const User = require("../models/User");
const Course = require("../models/Course");
const Lesson = require("../models/Lessons");
const LessonProgress = require("../models/LessonProgress");
const Activity = require("../models/Activity");

const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware("student"),
  async (req, res) => {
    try {
      const studentId = req.user.id;

      const progress = await LessonProgress.find({
        studentId,
      });

      const completedLessons = progress.filter(
        (item) => item.status === "completed"
      ).length;

      const totalTime = progress.reduce(
        (sum, item) => sum + item.timeSpent,
        0
      );

      const totalLessons = await Lesson.countDocuments();

      const overallProgress =
        totalLessons > 0
          ? Math.round(
              (completedLessons / totalLessons) * 100
            )
          : 0;

      const recentActivity = await Activity.find({
        studentId,
      })
        .populate("courseId", "title")
        .populate("lessonId", "title")
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({
        completedLessons,
        totalLessons,
        totalTime,
        overallProgress,
        recentActivity,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

router.post(
  "/lessons/:lessonId/complete",
  authMiddleware,
  roleMiddleware("student"),
  async (req, res) => {
    try {
      const studentId = req.user.id;
      const { lessonId } = req.params;
      const { timeSpent = 0 } = req.body;

      const lesson = await Lesson.findById(lessonId);

      if (!lesson) {
        return res.status(404).json({
          message: "Lesson not found",
        });
      }

      const progress =
        await LessonProgress.findOneAndUpdate(
          {
            studentId,
            lessonId,
          },
          {
            studentId,
            lessonId,
            courseId: lesson.courseId,
            status: "completed",
            completedAt: new Date(),
            timeSpent,
          },
          {
            upsert: true,
            new: true,
          }
        );

      await Activity.create({
        studentId,
        courseId: lesson.courseId,
        lessonId,
        type: "LESSON_COMPLETED",
        title: `Completed ${lesson.title}`,
        timeSpent,
      });

      res.json({
        message: "Lesson completed",
        progress,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);
router.post(
  "/lessons/:lessonId/complete",
  authMiddleware,
  roleMiddleware("student"),
  async (req, res) => {
    try {
      const studentId = req.user.id;
      const { lessonId } = req.params;
      const { timeSpent = 0 } = req.body;

      const lesson = await Lesson.findById(lessonId);

      if (!lesson) {
        return res.status(404).json({
          message: "Lesson not found",
        });
      }

      const progress =
        await LessonProgress.findOneAndUpdate(
          {
            studentId,
            lessonId,
          },
          {
            studentId,
            lessonId,
            courseId: lesson.courseId,
            status: "completed",
            completedAt: new Date(),
            timeSpent,
          },
          {
            upsert: true,
            new: true,
          }
        );

      await Activity.create({
        studentId,
        courseId: lesson.courseId,
        lessonId,
        type: "LESSON_COMPLETED",
        title: `Completed ${lesson.title}`,
        timeSpent,
      });

      res.json({
        message: "Lesson completed",
        progress,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

module.exports = router;