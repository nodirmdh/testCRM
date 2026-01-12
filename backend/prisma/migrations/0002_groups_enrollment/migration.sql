-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('ACTIVE', 'PLANNED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TeacherGroupRole" AS ENUM ('LEAD', 'ASSISTANT');

-- CreateTable
CREATE TABLE "Teacher" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "specialization" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationMonths" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "scheduleText" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "GroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherGroup" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "role" "TeacherGroupRole" NOT NULL DEFAULT 'LEAD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TeacherGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Teacher_organizationId_idx" ON "Teacher"("organizationId");

-- CreateIndex
CREATE INDEX "Course_organizationId_idx" ON "Course"("organizationId");

-- CreateIndex
CREATE INDEX "Group_organizationId_idx" ON "Group"("organizationId");

-- CreateIndex
CREATE INDEX "Group_courseId_idx" ON "Group"("courseId");

-- CreateIndex
CREATE INDEX "Enrollment_organizationId_idx" ON "Enrollment"("organizationId");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_idx" ON "Enrollment"("studentId");

-- CreateIndex
CREATE INDEX "Enrollment_groupId_idx" ON "Enrollment"("groupId");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_groupId_leftAt_idx" ON "Enrollment"("studentId", "groupId", "leftAt");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_active_unique" ON "Enrollment"("studentId", "groupId") WHERE "leftAt" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TeacherGroup_teacherId_groupId_key" ON "TeacherGroup"("teacherId", "groupId");

-- CreateIndex
CREATE INDEX "TeacherGroup_organizationId_idx" ON "TeacherGroup"("organizationId");

-- CreateIndex
CREATE INDEX "TeacherGroup_teacherId_idx" ON "TeacherGroup"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherGroup_groupId_idx" ON "TeacherGroup"("groupId");

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherGroup" ADD CONSTRAINT "TeacherGroup_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherGroup" ADD CONSTRAINT "TeacherGroup_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherGroup" ADD CONSTRAINT "TeacherGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
