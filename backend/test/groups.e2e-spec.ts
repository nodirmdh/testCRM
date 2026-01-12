import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { AppModule } from './../src/app.module';

describe('Groups enrollment (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let accessToken: string;
  let organizationId: string;
  let groupId: string;
  let studentAId: string;
  let studentBId: string;

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
      data: { name: 'Test Academy' },
    });
    organizationId = organization.id;

    const passwordHash = await bcrypt.hash('testpass', 10);
    await prisma.user.create({
      data: {
        organizationId,
        email: 'owner@test.local',
        passwordHash,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    const studentA = await prisma.student.create({
      data: { organizationId, fullName: 'Student A' },
    });
    studentAId = studentA.id;

    const studentB = await prisma.student.create({
      data: { organizationId, fullName: 'Student B' },
    });
    studentBId = studentB.id;

    const course = await prisma.course.create({
      data: { organizationId, name: 'Math Basics' },
    });

    const group = await prisma.group.create({
      data: {
        organizationId,
        courseId: course.id,
        name: 'Group A',
        scheduleText: 'Mon/Wed 10:00',
      },
    });
    groupId = group.id;

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        organizationId,
        email: 'owner@test.local',
        password: 'testpass',
      })
      .expect(201);

    accessToken = login.body.accessToken;
  });

  afterAll(async () => {
    if (prisma) {
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

  it('enroll student into group', async () => {
    const response = await request(app.getHttpServer())
      .post(`/groups/${groupId}/enroll`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ studentId: studentAId })
      .expect(201);

    expect(response.body.studentId).toBe(studentAId);
    expect(response.body.groupId).toBe(groupId);
  });

  it('list group students', async () => {
    await request(app.getHttpServer())
      .post(`/groups/${groupId}/enroll`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ studentId: studentBId })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/groups/${groupId}/students`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const ids = response.body.map((entry: { student: { id: string } }) => entry.student.id);
    expect(ids).toContain(studentBId);
  });
});
