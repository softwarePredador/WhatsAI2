import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'admin@whatsai.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@whatsai.com',
      password: hashedPassword,
      role: 'ADMIN',
      active: true
    }
  });

  console.log('✅ Default user created:');
  console.log(`   Email: ${user.email}`);
  console.log(`   Password: admin123`);
  console.log(`   Role: ${user.role}`);

  console.log('\n🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
