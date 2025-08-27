// 테스트 사용자 생성 스크립트
import { PrismaClient, Role, Gender, AuthProvider, UserStatus } from '@prisma/client'

const db = new PrismaClient()

async function createTestUser() {
  try {
    // 기존 테스트 사용자 확인
    const existingUser = await db.user.findUnique({
      where: { email: 'test@example.com' }
    })

    if (existingUser) {
      console.log('✅ 테스트 사용자가 이미 존재합니다:', existingUser.email)
      return existingUser
    }

    // 테스트 사용자 생성
    const testUser = await db.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 사용자',
        emailVerified: true,
        role: Role.USER,
        status: UserStatus.ACTIVE,
        // OAuth 정보 추가 (Google로 가정)
        oauthAccounts: {
          create: {
            provider: AuthProvider.GOOGLE,
            providerUserId: 'test-google-user-id',
            email: 'test@example.com',
            emailVerified: true,
            name: '테스트 사용자',
            profileRaw: {
              id: 'test-google-user-id',
              email: 'test@example.com',
              name: '테스트 사용자',
              picture: 'https://via.placeholder.com/150'
            }
          }
        },
        // 프로필 정보 추가
        profile: {
          create: {
            nickname: '테스터',
            gender: Gender.M,
            birthDate: new Date('1990-01-01'),
            phone: '010-1234-5678'
          }
        },
        // 약관 동의 정보 추가
        termsConsents: {
          create: {
            version: '1.0',
            tosAgreed: true,
            privacyAgreed: true,
            marketingAgreed: true
          }
        }
      },
      include: {
        profile: true,
        termsConsents: true,
        oauthAccounts: true
      }
    })

    console.log('✅ 테스트 사용자가 생성되었습니다:')
    console.log('   Email:', testUser.email)
    console.log('   Name:', testUser.name)
    console.log('   Role:', testUser.role)
    console.log('   Profile:', testUser.profile)
    console.log('   Terms:', testUser.termsConsents)

    // 테스트용 사주 데이터도 생성
    const sajuData = await db.sajuData.create({
      data: {
        userId: testUser.id,
        name: '홍길동',
        birthDate: new Date('2024-03-15T10:30:00+09:00'),
        birthTime: '10:30',
        isLunar: false,
        gender: 'M',
        yearStem: '갑',
        yearBranch: '진',
        monthStem: '정',
        monthBranch: '묘',
        dayStem: '무',
        dayBranch: '자',
        hourStem: '정',
        hourBranch: '사',
        fiveElements: {
          wood: 2,
          fire: 2,
          earth: 1,
          metal: 1,
          water: 2
        }
      }
    })

    console.log('✅ 테스트 사주 데이터가 생성되었습니다:', sajuData.name)

    // 테스트용 작명 결과도 하나 생성
    const namingResult = await db.namingResult.create({
      data: {
        userId: testUser.id,
        sajuDataId: sajuData.id,
        fullName: '홍길동',
        lastName: '홍',
        firstName: '길동',
        lastNameHanja: '洪',
        firstNameHanja: '吉東',
        totalStrokes: 15,
        balanceScore: 85.5,
        soundScore: 90.0,
        overallScore: 87.75,
        elementBalance: {
          wood: 2,
          fire: 2,
          earth: 2,
          metal: 1,
          water: 1
        }
      }
    })

    console.log('✅ 테스트 작명 결과가 생성되었습니다:', namingResult.fullName)

    return testUser
  } catch (error) {
    console.error('❌ 테스트 사용자 생성 중 오류:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

// 스크립트 실행
createTestUser()
  .then(() => {
    console.log('✅ 스크립트가 성공적으로 완료되었습니다.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 중 오류:', error)
    process.exit(1)
  })