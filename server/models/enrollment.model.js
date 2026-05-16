import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
    },
    videoWatched: {
        type: Boolean,
        default: false
    },
    testAttempts: [{
        attemptNumber: Number,
        score: Number,
        totalQuestions: Number,
        answers: [{
            questionIndex: Number,
            selectedAnswer: Number,
            isCorrect: Boolean
        }],
        completedAt: {
            type: Date,
            default: Date.now
        }
    }],
    bestScore: {
        type: Number,
        default: 0
    },
    certificateGenerated: {
        type: Boolean,
        default: false
    },
    certificateUrl: {
        type: String
    },
    completedAt: {
        type: Date
    },
    enrolledAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

