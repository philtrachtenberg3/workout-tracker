-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workoutId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "structure" TEXT NOT NULL DEFAULT 'sets',
    CONSTRAINT "Exercise_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Exercise" ("id", "name", "order", "workoutId") SELECT "id", "name", "order", "workoutId" FROM "Exercise";
DROP TABLE "Exercise";
ALTER TABLE "new_Exercise" RENAME TO "Exercise";
CREATE INDEX "Exercise_workoutId_idx" ON "Exercise"("workoutId");
CREATE INDEX "Exercise_name_idx" ON "Exercise"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
