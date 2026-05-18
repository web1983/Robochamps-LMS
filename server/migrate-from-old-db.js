/**
 * Copy LMS data from an old MongoDB database into the current one.
 *
 * Usage (PowerShell):
 *   $env:OLD_MONGO_URI="mongodb+srv://USER:PASS@cluster0.OLD_HOST.mongodb.net/lms"
 *   node migrate-from-old-db.js
 *
 * Uses MONGO_URI from server/.env for the destination (new database).
 *
 * Options:
 *   --all          Also copy users and enrollments
 *   --dry-run      Show counts only, do not write
 */

import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const OLD_URI = process.env.OLD_MONGO_URI;
const NEW_URI = process.env.MONGO_URI;

const args = process.argv.slice(2);
const copyAll = args.includes("--all");
const dryRun = args.includes("--dry-run");

const COLLECTIONS = [
  "courses",
  "settings",
  "schoolcodes",
  ...(copyAll ? ["users", "enrollments"] : []),
];

async function copyCollection(sourceDb, destDb, name) {
  const source = sourceDb.collection(name);
  const dest = destDb.collection(name);

  const docs = await source.find({}).toArray();
  if (docs.length === 0) {
    console.log(`  ${name}: 0 documents (skipped)`);
    return { name, copied: 0, skipped: 0 };
  }

  if (dryRun) {
    console.log(`  ${name}: would copy ${docs.length} document(s)`);
    return { name, copied: docs.length, skipped: 0 };
  }

  let copied = 0;
  let skipped = 0;

  for (const doc of docs) {
    let result;

    if (name === "settings" && doc.settingsId) {
      const { _id, ...fields } = doc;
      result = await dest.updateOne(
        { settingsId: doc.settingsId },
        { $set: fields },
        { upsert: true }
      );
    } else if (name === "schoolcodes" && doc.code) {
      const { _id, ...fields } = doc;
      result = await dest.updateOne(
        { code: doc.code },
        { $set: fields },
        { upsert: true }
      );
    } else {
      result = await dest.replaceOne({ _id: doc._id }, doc, { upsert: true });
    }

    if (result.upsertedCount || result.modifiedCount) copied += 1;
    else skipped += 1;
  }

  console.log(`  ${name}: ${copied} copied/updated, ${skipped} unchanged`);
  return { name, copied, skipped };
}

async function main() {
  if (!OLD_URI) {
    console.error("\nMissing OLD_MONGO_URI.\n");
    console.error("Set your OLD Atlas connection string, for example:");
    console.error('  $env:OLD_MONGO_URI="mongodb+srv://user:pass@cluster0.qq7t3bw.mongodb.net/lms"\n');
    process.exit(1);
  }

  if (!NEW_URI) {
    console.error("\nMissing MONGO_URI in server/.env (new database).\n");
    process.exit(1);
  }

  if (OLD_URI === NEW_URI) {
    console.error("\nOLD_MONGO_URI and MONGO_URI are the same. Use different databases.\n");
    process.exit(1);
  }

  console.log("\nRoboChamps LMS — database migration");
  console.log(dryRun ? "Mode: DRY RUN (no writes)\n" : "Mode: COPY\n");
  console.log("From:", OLD_URI.replace(/:[^:@]+@/, ":****@"));
  console.log("To:  ", NEW_URI.replace(/:[^:@]+@/, ":****@"));
  console.log("\nCollections:", COLLECTIONS.join(", "), "\n");

  const sourceConn = await mongoose.createConnection(OLD_URI).asPromise();
  const destConn = await mongoose.createConnection(NEW_URI).asPromise();

  const sourceDb = sourceConn.db;
  const destDb = destConn.db;

  try {
    for (const name of COLLECTIONS) {
      await copyCollection(sourceDb, destDb, name);
    }

    if (!copyAll) {
      console.log("\nNote: users/enrollments were NOT copied (only courses, settings, school codes).");
      console.log("To include them: node migrate-from-old-db.js --all\n");
    }

    console.log(dryRun ? "\nDry run complete.\n" : "\nMigration complete.\n");
  } finally {
    await sourceConn.close();
    await destConn.close();
  }
}

main().catch((err) => {
  console.error("\nMigration failed:", err.message);
  process.exit(1);
});
