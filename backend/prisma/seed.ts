import { PrismaClient, SubscriptionStatus, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const organizationName = 'Demo Academy';
  const ownerEmail = 'owner@demo.local';
  const ownerPassword = '123456';
  const planCode = 'DEMO';

  let organization = await prisma.organization.findFirst({
    where: { name: organizationName },
  });

  if (!organization) {
    organization = await prisma.organization.create({
      data: { name: organizationName },
    });
  }

  const passwordHash = await bcrypt.hash(ownerPassword, 10);

  await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: ownerEmail,
      },
    },
    update: {
      passwordHash,
      role: UserRole.OWNER,
      status: UserStatus.ACTIVE,
    },
    create: {
      organizationId: organization.id,
      email: ownerEmail,
      passwordHash,
      role: UserRole.OWNER,
      status: UserStatus.ACTIVE,
    },
  });

  const subscription = await prisma.subscription.findFirst({
    where: { organizationId: organization.id },
  });

  if (!subscription) {
    await prisma.subscription.create({
      data: {
        organizationId: organization.id,
        planCode,
        status: SubscriptionStatus.ACTIVE,
      },
    });
  } else {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { planCode, status: SubscriptionStatus.ACTIVE },
    });
  }

  console.log(
    `Seeded organization ${organization.name} (${organization.id}) with owner ${ownerEmail}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
