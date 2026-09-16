-- CreateTable
CREATE TABLE "Workout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawTranscript" TEXT NOT NULL,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workoutId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "Exercise_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SetEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "reps" INTEGER,
    "weight" REAL,
    "weightUnit" TEXT NOT NULL DEFAULT 'lb',
    "durationSeconds" INTEGER,
    "distance" REAL,
    "distanceUnit" TEXT,
    "rpe" REAL,
    "notes" TEXT,
    CONSTRAINT "SetEntry_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Workout_date_idx" ON "Workout"("date");

-- CreateIndex
CREATE INDEX "Exercise_workoutId_idx" ON "Exercise"("workoutId");

-- CreateIndex
CREATE INDEX "Exercise_name_idx" ON "Exercise"("name");

-- CreateIndex
CREATE INDEX "SetEntry_exerciseId_idx" ON "SetEntry"("exerciseId");
