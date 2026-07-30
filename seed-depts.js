const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.department.count();
  if (count > 0) {
    console.log('Departments already seeded');
    return;
  }

  const initial = [
    { name: 'General',   icon: 'FolderOpen', color: '#3b82f6' },
    { name: 'HVAC',      icon: 'Wind',       color: '#06b6d4' },
    { name: 'Eléctrico', icon: 'Zap',        color: '#f59e0b' },
    { name: 'Plomería',  icon: 'Droplets',   color: '#3b82f6' },
    { name: 'Civil',     icon: 'HardHat',    color: '#10b981' },
    { name: 'Sistemas',  icon: 'Monitor',    color: '#a855f7' },
  ];

  await prisma.department.createMany({ data: initial });
  console.log('Seeded initial departments');
}

main().catch(console.error).finally(() => prisma.$disconnect());
