const express = require("express");

const Course = require("../models/Course");
const Lesson = require("../models/Lessons");
const User = require("../models/User");
const Activity = require("../models/Activity");
const LessonProgress = require("../models/LessonProgress");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const bcrypt = require("bcryptjs");

const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

const router = express.Router();
router.post(
  "/students",
  authMiddleware,
  roleMiddleware("mentor"),
  async (req, res) => {
    try {
      const {
        fullName,
        email,
        phone,
        initialPassword,
        course,
        enrollDate,
        status,
        message,
        sendEmail,
      } = req.body;


      // -----------------------------
      // Validation
      // -----------------------------

      if (!fullName || !email || !initialPassword) {
        return res.status(400).json({
          message:
            "Full name, email and password are required",
        });
      }


      // -----------------------------
      // Check existing student
      // -----------------------------

      const existingStudent = await User.findOne({
        email: email.toLowerCase(),
      });

      if (existingStudent) {
        return res.status(400).json({
          message: "A user with this email already exists",
        });
      }


      // -----------------------------
      // Hash password
      // -----------------------------

      const hashedPassword = await bcrypt.hash(
        initialPassword,
        10
      );


      // -----------------------------
      // Create student
      // -----------------------------

      const student = await User.create({
        name: fullName,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "student",
        phone: phone || "",
      });


      // -----------------------------
      // Response
      // -----------------------------

      res.status(201).json({
        message: "Student created successfully",

        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          role: student.role,
          phone: student.phone,
        },

        enrollment: {
          course: course || null,
          enrollDate: enrollDate || null,
          status: status || "active",
        },

        welcomeEmail: {
          sendEmail: sendEmail || false,
          message: message || "",
        },
      });

    } catch (error) {
      console.error(
        "Add student error:",
        error
      );

      res.status(500).json({
        message: error.message,
      });
    }
  }
);
router.post(
  "/courses",
  authMiddleware,
  roleMiddleware("mentor"),
  async (req, res) => {
    try {
      const course = await Course.create({
        ...req.body,
        mentorId: req.user.id,
      });

      res.status(201).json(course);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);
router.post(
  "/courses/:courseId/lessons",
  authMiddleware,
  roleMiddleware("mentor"),
  async (req, res) => {
    try {
      const { courseId } = req.params;

      const course = await Course.findOne({
        _id: courseId,
        mentorId: req.user.id,
      });

      if (!course) {
        return res.status(404).json({
          message: "Course not found",
        });
      }

      const lesson = await Lesson.create({
        ...req.body,
        courseId,
      });

      res.status(201).json(lesson);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);
router.post(
  "/courses/:courseId/quizzes",
  authMiddleware,
  roleMiddleware("mentor"),
  async (req, res) => {
    try {
      const { courseId } = req.params;

      const quiz = await Quiz.create({
        ...req.body,
        courseId,
        mentorId: req.user.id,
      });

      res.status(201).json(quiz);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);
router.post(
  "/courses/:courseId/quizzes",
  authMiddleware,
  roleMiddleware("mentor"),
  async (req, res) => {
    try {
      const { courseId } = req.params;

      const quiz = await Quiz.create({
        ...req.body,
        courseId,
        mentorId: req.user.id,
      });

      res.status(201).json(quiz);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);
router.get(
  "/students/:studentId/activity",
  authMiddleware,
  roleMiddleware("mentor"),
  async (req, res) => {
    try {
      const activities = await Activity.find({
        studentId: req.params.studentId,
      })
        .populate("courseId", "title")
        .populate("lessonId", "title")
        .sort({ createdAt: -1 });

      res.json(activities);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);
module.exports = router;