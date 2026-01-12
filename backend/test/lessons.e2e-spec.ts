import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { AppModule } from './../src/app.module';

describe('Lessons and attendance (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let accessToken: string;
  let organizationId: string;
  let groupId: string;
  let teacherId: string;
  let studentId: string;
  let lessonId: string;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test_access';
    process.env.JWT_REFRESH_SECRET = 'test_refresh';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = new PrismaClient();
    await prisma.$connect();

    const organization = await prisma.organization.create({
      data: { name: 'Lessons Academy' },
    });
    organizationId = organization.id;

    const passwordHash = await bcrypt.hash('testpass', 10);
    await prisma.user.create({
      data: {
        organizationId,
        email: 'owner@lessons.local',
        passwordHash,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    const student = await prisma.student.create({
      data: { organizationId, fullName: 'Student L1' },
    });
    studentId = student.id;

    const teacher = await prisma.teacher.create({
      data: {
        organizationId,
        fullName: 'Teacher L1',
        phone: '000-000',
      },
    });
    teacherId = teacher.id;

    const course = await prisma.course.create({
      data: { organizationId, name: 'History' },
    });

    const group = await prisma.group.create({
      data: {
        organizationId,
        courseId: course.id,
        name: 'Group L1',
        scheduleText: 'Tue 10:00',
      },
    });
    groupId = group.id;

    await prisma.teacherGroup.create({
      data: { organizationId, groupId, teacherId },
    });

    await prisma.enrollment.create({
      data: { organizationId, groupId, studentId },
    });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        organizationId,
        email: 'owner@lessons.local',
        password: 'testpass',
      })
      .expect(201);

    accessToken = login.body.accessToken;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.attendance.deleteMany({ where: { organizationId } });
      await prisma.lessonSession.deleteMany({ where: { organizationId } });
      await prisma.teacherGroup.deleteMany({ where: { organizationId } });
      await prisma.enrollment.deleteMany({ where: { organizationId } });
      await prisma.group.deleteMany({ where: { organizationId } });
      await prisma.course.deleteMany({ where: { organizationId } });
      await prisma.teacher.deleteMany({ where: { organizationId } });
      await prisma.student.deleteMany({ where: { organizationId } });
      await prisma.user.deleteMany({ where: { organizationId } });
      await prisma.subscription.deleteMany({ where: { organizationId } });
      await prisma.organization.deleteMany({ where: { id: organizationId } });
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  it('create lesson + mark attendance', async () => {
    const lesson = await request(app.getHttpServer())
      .post('/lessons')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        groupId,
        teacherId,
        date: new Date().toISOString(),
        topic: 'Intro',
      })
      .expect(201);

    lessonId = lesson.body.id;

    const attendance = await request(app.getHttpServer())
      .post(`/lessons/${lessonId}/attendance`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        items: [{ studentId, status: 'PRESENT' }],
      })
      .expect(201);

    expect(attendance.body).toHaveLength(1);
    expect(attendance.body[0].studentId).toBe(studentId);
  });

  it('get group attendance', async () => {
    const response = await request(app.getHttpServer())
      .get(`/groups/${groupId}/attendance`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.length).toBeGreaterThan(0);
    const ids = response.body.map((entry: { lessonSessionId: string }) => entry.lessonSessionId);
    expect(ids).toContain(lessonId);
  });
});
