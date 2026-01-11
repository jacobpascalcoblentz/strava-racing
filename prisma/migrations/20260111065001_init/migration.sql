-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "stravaId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenExpiry" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Race" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizerId" TEXT NOT NULL,

    CONSTRAINT "Race_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceSegment" (
    "id" TEXT NOT NULL,
    "stravaSegmentId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "averageGrade" DOUBLE PRECISION NOT NULL,
    "raceId" TEXT NOT NULL,

    CONSTRAINT "RaceSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceParticipant" (
    "id" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "RaceParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SegmentEffort" (
    "id" TEXT NOT NULL,
    "elapsedTime" INTEGER NOT NULL,
    "activityDate" TIMESTAMP(3) NOT NULL,
    "stravaEffortId" BIGINT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SegmentEffort_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_stravaId_key" ON "User"("stravaId");

-- CreateIndex
CREATE UNIQUE INDEX "Race_slug_key" ON "Race"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "RaceParticipant_raceId_userId_key" ON "RaceParticipant"("raceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SegmentEffort_stravaEffortId_key" ON "SegmentEffort"("stravaEffortId");

-- AddForeignKey
ALTER TABLE "Race" ADD CONSTRAINT "Race_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceSegment" ADD CONSTRAINT "RaceSegment_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceParticipant" ADD CONSTRAINT "RaceParticipant_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceParticipant" ADD CONSTRAINT "RaceParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentEffort" ADD CONSTRAINT "SegmentEffort_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "RaceSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentEffort" ADD CONSTRAINT "SegmentEffort_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
