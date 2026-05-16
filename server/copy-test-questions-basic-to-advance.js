import mongoose from "mongoose";
import dotenv from "dotenv";
import { Course } from "./models/course.model.js";

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in environment variables");
  process.exit(1);
}

// Migration function to copy test questions from Basic to Advance
const copyTestQuestions = async (basicCategory, advanceCategory) => {
  try {
    console.log(`\n🔄 Starting migration: ${basicCategory} → ${advanceCategory}`);

    // Get all courses in basic category that have test questions
    const basicCourses = await Course.find({
      category: basicCategory,
      testQuestions: { $exists: true, $ne: [] }
    }).select('courseTitle testQuestions testTimeLimit');

    // Filter courses that actually have test questions (not empty array)
    const coursesWithQuestions = basicCourses.filter(course => 
      course.testQuestions && course.testQuestions.length > 0
    );

    console.log(`📚 Found ${coursesWithQuestions.length} courses with test questions in ${basicCategory}`);

    if (coursesWithQuestions.length === 0) {
      console.log(`⚠️  No courses with test questions found in ${basicCategory}`);
      return;
    }

    let successCount = 0;
    let notFoundCount = 0;
    let alreadyHasQuestionsCount = 0;

    // For each basic course, find matching advance course and copy test questions
    for (const basicCourse of coursesWithQuestions) {
      console.log(`\n🔍 Processing: "${basicCourse.courseTitle}"`);

      // Find matching course in advance category by courseTitle (case-insensitive)
      // First try exact match
      let advanceCourse = await Course.findOne({
        category: advanceCategory,
        courseTitle: basicCourse.courseTitle
      });

      // If not found, try case-insensitive match
      if (!advanceCourse) {
        const allAdvanceCourses = await Course.find({
          category: advanceCategory
        }).select('courseTitle');
        
        advanceCourse = allAdvanceCourses.find(ac => 
          ac.courseTitle.toLowerCase().trim() === basicCourse.courseTitle.toLowerCase().trim()
        );

        if (advanceCourse) {
          console.log(`   ℹ️  Found by case-insensitive match: "${advanceCourse.courseTitle}"`);
          // If found by case-insensitive match, get the full course document
          advanceCourse = await Course.findById(advanceCourse._id);
        } else {
          // If still not found, try partial match (for cases like "Smart Home Appliance Control" vs "Smart Home Appliance")
          advanceCourse = allAdvanceCourses.find(ac => {
            const basicTitle = basicCourse.courseTitle.toLowerCase().trim();
            const advanceTitle = ac.courseTitle.toLowerCase().trim();
            // Check if one title contains the other (for partial matches)
            return basicTitle.includes(advanceTitle) || advanceTitle.includes(basicTitle);
          });

          // If found by partial match, get the full course document
          if (advanceCourse) {
            console.log(`   ℹ️  Found by partial match: "${advanceCourse.courseTitle}"`);
            advanceCourse = await Course.findById(advanceCourse._id);
          }
        }
      }

      if (!advanceCourse) {
        console.log(`❌ Not found in ${advanceCategory}: "${basicCourse.courseTitle}"`);
        notFoundCount++;
        continue;
      }

      // Check if advance course already has test questions
      if (advanceCourse.testQuestions && advanceCourse.testQuestions.length > 0) {
        console.log(`⚠️  Already has ${advanceCourse.testQuestions.length} test questions. Skipping...`);
        alreadyHasQuestionsCount++;
        continue;
      }

      // Copy test questions and test time limit
      advanceCourse.testQuestions = JSON.parse(JSON.stringify(basicCourse.testQuestions)); // Deep copy
      if (basicCourse.testTimeLimit) {
        advanceCourse.testTimeLimit = basicCourse.testTimeLimit;
      }

      await advanceCourse.save();
      console.log(`✅ Copied ${basicCourse.testQuestions.length} test questions to "${advanceCourse.courseTitle}"`);
      successCount++;
    }

    console.log(`\n📊 Migration Summary for ${basicCategory} → ${advanceCategory}:`);
    console.log(`   ✅ Successfully copied: ${successCount}`);
    console.log(`   ❌ Not found in advance category: ${notFoundCount}`);
    console.log(`   ⚠️  Already had questions (skipped): ${alreadyHasQuestionsCount}`);
  } catch (error) {
    console.error(`❌ Error migrating ${basicCategory} → ${advanceCategory}:`, error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    console.log("🚀 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB Connected\n");

    // Copy test questions from Grade 6-8 Basic to Advance
    await copyTestQuestions('grade_6_8_basic', 'grade_6_8_advance');

    // Copy test questions from Grade 9-12 Basic to Advance
    await copyTestQuestions('grade_9_12_basic', 'grade_9_12_advance');

    console.log("\n🎉 Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
};

// Run the migration
main();
