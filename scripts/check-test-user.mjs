import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking for test user...')

  const testUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' },
    include: {
      profile: true,
      termsConsents: true
    }
  })

  if (testUser) {
    console.log('✅ Test user exists!')
    console.log('User ID:', testUser.id)
    console.log('Email:', testUser.email)
    console.log('Name:', testUser.name)
    console.log('Has Profile:', !!testUser.profile)
    console.log('Terms Consents:', testUser.termsConsents.length)
  } else {
    console.log('❌ Test user NOT found!')
    console.log('\n📝 Creating test user...')

    const newUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 사용자',
        emailVerified: true,
        role: 'USER',
        status: 'ACTIVE'
      }
    })

    console.log('✅ Test user created!')
    console.log('User ID:', newUser.id)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
