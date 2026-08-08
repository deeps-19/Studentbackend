const express = require("express");
const mongoose = require("mongoose");
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

      // -----------------------------------------
      // 1. Student lesson progress
      // -----------------------------------------

      const progress = await LessonProgress.find({
        studentId,
      });

      // -----------------------------------------
      // 2. Completed lessons
      // -----------------------------------------

      const completedLessons = progress.filter(
        (item) => item.status === "completed"
      ).length;

      // -----------------------------------------
      // 3. Total learning time
      // -----------------------------------------

      const totalTime = progress.reduce(
        (sum, item) =>
          sum + (item.timeSpent || 0),
        0
      );

      // -----------------------------------------
      // 4. Total lessons
      // -----------------------------------------

      const totalLessons =
        await Lesson.countDocuments();

      // -----------------------------------------
      // 5. Overall progress
      // -----------------------------------------

      const overallProgress =
        totalLessons > 0
          ? Math.round(
              (completedLessons / totalLessons) * 100
            )
          : 0;

      // -----------------------------------------
      // 6. Recent activity
      // -----------------------------------------

      const recentActivity =
        await Activity.find({
          studentId,
        })
          .populate("courseId", "title")
          .populate("lessonId", "title")
          .sort({ createdAt: -1 })
          .limit(5);

      // -----------------------------------------
      // 7. Get all courses
      // -----------------------------------------

      const courses = await Course.find();

      // -----------------------------------------
      // 8. Course progress
      // -----------------------------------------

      const courseProgress = await Promise.all(
        courses.map(async (course) => {

          // Get lessons from Lesson collection
          const courseLessons =
            await Lesson.find({
              courseId: course._id,
            });

          const totalCourseLessons =
            courseLessons.length;

          // Get lesson IDs belonging to this course
          const lessonIds =
            courseLessons.map((lesson) =>
              lesson._id.toString()
            );

          // Get student's progress for this course
          const courseProgressData =
            progress.filter((item) => {

              return (
                item.courseId?.toString() ===
                  course._id.toString() &&
                lessonIds.includes(
                  item.lessonId?.toString()
                )
              );
            });

          // Completed lessons
          const completed =
            courseProgressData.filter(
              (item) =>
                item.status === "completed"
            ).length;

          // Course percentage
          const percentage =
            totalCourseLessons > 0
              ? Math.round(
                  (completed /
                    totalCourseLessons) *
                    100
                )
              : 0;

          // Course time
          const timeSpent =
            courseProgressData.reduce(
              (sum, item) =>
                sum + (item.timeSpent || 0),
              0
            );

          return {
            courseId: course._id,
            title: course.title,

            completedLessons: completed,

            totalLessons:
              totalCourseLessons,

            progress: percentage,

            timeSpent,
          };
        })
      );

      // -----------------------------------------
      // 9. Active courses
      // -----------------------------------------

      const activeCourses =
        courseProgress.filter(
          (course) =>
            course.progress > 0 &&
            course.progress < 100
        ).length;

      // -----------------------------------------
      // 10. Learning activity trend
      // -----------------------------------------

      const activityTrend =
        await Activity.aggregate([
          {
            $match: {
              studentId:
                new mongoose.Types.ObjectId(
                  studentId
                ),
            },
          },

          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                },
              },

              minutes: {
                $sum: {
                  $ifNull: [
                    "$timeSpent",
                    0,
                  ],
                },
              },
            },
          },

          {
            $sort: {
              _id: 1,
            },
          },
        ]);

      // -----------------------------------------
      // 11. Convert _id to date
      // -----------------------------------------

      const formattedActivityTrend =
        activityTrend.map((item) => ({
          date: item._id,
          minutes: item.minutes,
        }));

      // -----------------------------------------
      // 12. Final response
      // -----------------------------------------

      res.json({
        completedLessons,

        totalLessons,

        totalTime,

        overallProgress,

        activeCourses,

        courses: courseProgress,

        activityTrend:
          formattedActivityTrend,

        recentActivity,
      });

    } catch (error) {

      console.error(
        "Student dashboard error:",
        error
      );

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

router.get(
  "/courses",
  authMiddleware,
  roleMiddleware("student"),
  async (req, res) => {
    try {
      const studentId = req.user.id;

      // Get all courses
      const courses = await Course.find()
        .sort({ createdAt: -1 })
        .lean();

      // Get all lessons
      const lessons = await Lesson.find()
        .lean();

      // Get student's progress
      const progress = await LessonProgress.find({
        studentId,
      }).lean();

      const courseData = courses.map((course) => {
        // Lessons belonging to this course
        const courseLessons = lessons.filter(
          (lesson) =>
            lesson.courseId?.toString() ===
            course._id.toString()
        );

        const lessonIds = courseLessons.map(
          (lesson) => lesson._id.toString()
        );

        // Student progress for this course
        const courseProgress = progress.filter(
          (item) =>
            item.courseId?.toString() ===
              course._id.toString() &&
            lessonIds.includes(
              item.lessonId?.toString()
            )
        );

        // Completed lessons
        const completedLessons =
          courseProgress.filter(
            (item) =>
              item.status === "completed"
          ).length;

        // Total lessons
        const totalLessons =
          courseLessons.length;

        // Progress percentage
        const progressPercentage =
          totalLessons > 0
            ? Math.round(
                (completedLessons /
                  totalLessons) *
                  100
              )
            : 0;

        // Time spent
        const timeSpent =
          courseProgress.reduce(
            (sum, item) =>
              sum + (item.timeSpent || 0),
            0
          );

        return {
          _id: course._id,
          title: course.title,
          description: course.description,
          category: course.category,
          image: course.image,

          totalLessons,

          completedLessons,

          progress: progressPercentage,

          timeSpent,
        };
      });

      res.json({
        courses: courseData,
      });

    } catch (error) {
      console.error(
        "Fetch courses error:",
        error
      );

      res.status(500).json({
        message: error.message,
      });
    }
  }
);

module.exports = router;