// 테스트 사용자 생성 스크립트
import { 
  PrismaClient, 
  Role, 
  Gender, 
  AuthProvider, 
  UserStatus,
  PaymentMethod,
  PaymentStatus,
  ServiceType,
  OrderStatus,
  Currency,
  PaymentEventType
} from '@prisma/client'

const db = new PrismaClient()

async function createTestPaymentData(userId: string) {
  // 테스트용 서비스 주문 및 결제 데이터 생성
  // 1. 완료된 작명 서비스
  const order1 = await db.serviceOrder.create({
    data: {
      userId,
      serviceType: ServiceType.NAMING,
      status: OrderStatus.COMPLETED,
      price: 50000,
      completedAt: new Date('2024-03-20T14:30:00+09:00'),
      resultData: {
        name: '홍길동',
        score: 87.75
      }
    }
  })

  const payment1 = await db.payment.create({
    data: {
      userId,
      serviceOrderId: order1.id,
      provider: 'tosspayments',
      transactionId: 'test_txn_001',
      method: PaymentMethod.CARD,
      status: PaymentStatus.COMPLETED,
      amount: 50000,
      currency: Currency.KRW,
      paidAt: new Date('2024-03-20T14:00:00+09:00'),
      metadata: {
        cardName: '신한카드',
        cardNumber: '**** **** **** 1234'
      }
    }
  })

  // 결제 이벤트 로그 추가
  await db.paymentEvent.create({
    data: {
      paymentId: payment1.id,
      eventType: PaymentEventType.REQUESTED,
      status: PaymentStatus.PENDING,
      amount: 50000,
      currency: Currency.KRW,
      message: '결제 요청됨'
    }
  })

  await db.paymentEvent.create({
    data: {
      paymentId: payment1.id,
      eventType: PaymentEventType.APPROVED,
      status: PaymentStatus.COMPLETED,
      amount: 50000,
      currency: Currency.KRW,
      message: '결제 승인 완료'
    }
  })

  console.log('✅ 테스트 서비스 주문 1 생성:', order1.serviceType, '-', order1.status)

  // 2. 진행 중인 개명 서비스
  const order2 = await db.serviceOrder.create({
    data: {
      userId,
      serviceType: ServiceType.RENAMING,
      status: OrderStatus.IN_PROGRESS,
      price: 80000
    }
  })

  const payment2 = await db.payment.create({
    data: {
      userId,
      serviceOrderId: order2.id,
      provider: 'kakaopay',
      transactionId: 'test_txn_002',
      method: PaymentMethod.KAKAO_PAY,
      status: PaymentStatus.COMPLETED,
      amount: 80000,
      currency: Currency.KRW,
      paidAt: new Date('2024-03-25T10:00:00+09:00'),
      metadata: {
        kakaoTid: 'T1234567890'
      }
    }
  })

  console.log('✅ 테스트 서비스 주문 2 생성:', order2.serviceType, '-', order2.status)

  // 3. 환불된 서비스
  const order3 = await db.serviceOrder.create({
    data: {
      userId,
      serviceType: ServiceType.SAJU_COMPATIBILITY,
      status: OrderStatus.CANCELLED,
      price: 30000
    }
  })

  const payment3 = await db.payment.create({
    data: {
      userId,
      serviceOrderId: order3.id,
      provider: 'tosspayments',
      transactionId: 'test_txn_003',
      method: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.REFUNDED,
      amount: 30000,
      currency: Currency.KRW,
      paidAt: new Date('2024-03-18T09:00:00+09:00'),
      refundedAt: new Date('2024-03-19T15:00:00+09:00'),
      metadata: {
        refundReason: '고객 요청',
        refundAmount: 30000
      }
    }
  })

  console.log('✅ 테스트 서비스 주문 3 생성:', order3.serviceType, '-', order3.status)
}

async function createTestUser() {
  try {
    // 기존 테스트 사용자 확인
    const existingUser = await db.user.findUnique({
      where: { email: 'test@example.com' }
    })

    if (existingUser) {
      console.log('✅ 테스트 사용자가 이미 존재합니다:', existingUser.email)
      
      // 기존 결제 데이터 확인
      const existingPayments = await db.payment.findMany({
        where: { userId: existingUser.id }
      })
      
      if (existingPayments.length > 0) {
        console.log('   이미', existingPayments.length, '개의 결제 데이터가 존재합니다.')
        return existingUser
      }
      
      // 결제 데이터가 없으면 테스트 데이터 추가
      console.log('   결제 테스트 데이터를 추가합니다...')
      await createTestPaymentData(existingUser.id)
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
        birthDate: new Date('2024-03-15'),
        birthTime: '10:30',
        isLunar: false,
        gender: 'M',
        yearGan: '갑',
        yearJi: '진',
        monthGan: '정',
        monthJi: '묘',
        dayGan: '무',
        dayJi: '자',
        hourGan: '정',
        hourJi: '사',
        woodCount: 2,
        fireCount: 2,
        earthCount: 1,
        metalCount: 1,
        waterCount: 2
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
        meaningScore: 88.0,
        overallScore: 87.75,
        generationMethod: 'rule-based',
        preferredValues: {
          wood: 2,
          fire: 2,
          earth: 2,
          metal: 1,
          water: 1
        }
      }
    })

    console.log('✅ 테스트 작명 결과가 생성되었습니다:', namingResult.fullName)

    // 테스트용 서비스 주문 및 결제 데이터 생성
    await createTestPaymentData(testUser.id)

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