import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const payments = await prisma.payment.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { email: true, name: true }
      },
      serviceOrder: {
        select: { serviceType: true, status: true }
      }
    }
  })

  console.log(`\n총 결제 건수: ${await prisma.payment.count()}\n`)

  if (payments.length === 0) {
    console.log('❌ 결제 데이터가 없습니다.')
  } else {
    console.log('최근 결제 내역:')
    payments.forEach((p, i) => {
      console.log(`\n${i + 1}. ID: ${p.id}`)
      console.log(`   거래ID: ${p.transactionId}`)
      console.log(`   금액: ${p.amount}원`)
      console.log(`   상태: ${p.status}`)
      console.log(`   결제수단: ${p.method}`)
      console.log(`   사용자: ${p.user.email} (${p.user.name})`)
      console.log(`   서비스: ${p.serviceOrder.serviceType}`)
      console.log(`   생성일: ${p.createdAt}`)
    })
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
