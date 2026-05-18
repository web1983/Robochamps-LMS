import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
const courses = mongoose.connection.db.collection("courses");

const total = await courses.countDocuments();
const livePublished = await courses.countDocuments({
  isPublished: true,
  isLive: true,
});

const byCat = await courses
  .aggregate([
    {
      $group: {
        _id: "$category",
        total: { $sum: 1 },
        livePub: {
          $sum: {
            $cond: [{ $and: ["$isPublished", "$isLive"] }, 1, 0],
          },
        },
      },
    },
    { $sort: { total: -1 } },
  ])
  .toArray();

const flags = await courses
  .aggregate([
    {
      $group: {
        _id: {
          isPublished: { $ifNull: ["$isPublished", false] },
          isLive: { $ifNull: ["$isLive", false] },
        },
        count: { $sum: 1 },
      },
    },
  ])
  .toArray();

console.log("=== Course diagnostics (new DB) ===\n");
console.log("Total courses:", total);
console.log("Published + Live (what home page needs):", livePublished);
console.log("\nBy isPublished / isLive:");
flags.forEach((f) =>
  console.log(
    `  published=${f._id.isPublished}, live=${f._id.isLive} → ${f.count} courses`
  )
);
console.log("\nBy category (total / published+live):");
byCat.forEach((c) =>
  console.log(`  ${c._id || "(none)"}: ${c.total} total, ${c.livePub} visible`)
);

const users = mongoose.connection.db.collection("users");
const studentsWithCat = await users
  .find({ role: "student", category: { $exists: true, $ne: null } })
  .project({ email: 1, category: 1 })
  .limit(5)
  .toArray();
console.log("\nSample students with category:");
studentsWithCat.forEach((u) => console.log(`  ${u.email} → ${u.category}`));

await mongoose.disconnect();
