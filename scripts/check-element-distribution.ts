import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkElementDistribution() {
  const total = await prisma.hanjaDict.count();
  const withElement = await prisma.hanjaDict.count({
    where: { element: { not: null } }
  });
  const withoutElement = total - withElement;

  const elementDist = await prisma.hanjaDict.groupBy({
    by: ['element'],
    _count: true
  });

  console.log('='.repeat(60));
  console.log('ELEMENT DISTRIBUTION IN DATABASE');
  console.log('='.repeat(60));
  console.log(`Total hanja: ${total}`);
  console.log(`With element: ${withElement}`);
  console.log(`Without element (null): ${withoutElement}`);
  console.log('\nElement breakdown:');
  elementDist.forEach(e => {
    console.log(`  ${e.element || 'null'}: ${e._count}`);
  });

  await prisma.$disconnect();
}

checkElementDistribution();
