-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('YOUTUBE', 'REDDIT', 'FACEBOOK');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('EMAIL');

-- CreateEnum
CREATE TYPE "SignalSource" AS ENUM ('EXPLICIT_COMMENT', 'USERNAME_INFERENCE', 'PROFILE_SCRAPE', 'HEURISTIC_GUESS');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisSession" (
    "id" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "totalComments" INTEGER,
    "totalParticipants" INTEGER,
    "contactSignalsFound" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AnalysisSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "profileUrl" TEXT,
    "commentSnippet" TEXT,
    "commentCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSignal" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "type" "ContactType" NOT NULL,
    "value" TEXT NOT NULL,
    "source" "SignalSource" NOT NULL,
    "confidence" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isMasked" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "AnalysisSession_platform_idx" ON "AnalysisSession"("platform");

-- CreateIndex
CREATE INDEX "AnalysisSession_createdAt_idx" ON "AnalysisSession"("createdAt");

-- CreateIndex
CREATE INDEX "AnalysisSession_userId_idx" ON "AnalysisSession"("userId");

-- CreateIndex
CREATE INDEX "Participant_sessionId_idx" ON "Participant"("sessionId");

-- CreateIndex
CREATE INDEX "Participant_username_idx" ON "Participant"("username");

-- CreateIndex
CREATE INDEX "ContactSignal_participantId_idx" ON "ContactSignal"("participantId");

-- CreateIndex
CREATE INDEX "ContactSignal_type_idx" ON "ContactSignal"("type");

-- CreateIndex
CREATE INDEX "ContactSignal_confidence_idx" ON "ContactSignal"("confidence");

-- AddForeignKey
ALTER TABLE "AnalysisSession" ADD CONSTRAINT "AnalysisSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalysisSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactSignal" ADD CONSTRAINT "ContactSignal_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
