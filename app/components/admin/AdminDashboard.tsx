"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Line, Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { TrendingUp, Users, CreditCard, FileText } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

// 모의 데이터
const mockStats = {
  totalRevenue: 15800000,
  totalUsers: 342,
  totalNamings: 486,
  avgRevenue: 3248000,
}

const mockRecentNamings = [
  { id: 1, userName: "김철수", servicType: "퀵생성", price: 700000, date: new Date(), status: "완료" },
  { id: 2, userName: "이영희", servicType: "전문가 1:1", price: 800000, date: new Date(), status: "진행중" },
  { id: 3, userName: "박민수", servicType: "그룹(5명)", price: 200000, date: new Date(), status: "완료" },
  { id: 4, userName: "최지은", servicType: "퀵생성", price: 700000, date: new Date(), status: "완료" },
  { id: 5, userName: "정대한", servicType: "그룹(10명)", price: 100000, date: new Date(), status: "대기중" },
]

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
}

const revenueData = {
  labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
  datasets: [
    {
      label: '월별 매출',
      data: [12000000, 19000000, 15000000, 25000000, 22000000, 30000000],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
    },
  ],
}

const serviceData = {
  labels: ['퀵생성', '전문가 1:1', '그룹(3명)', '그룹(5명)', '그룹(10명)'],
  datasets: [
    {
      label: '서비스별 이용 건수',
      data: [234, 89, 45, 67, 51],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(168, 85, 247, 0.8)',
      ],
    },
  ],
}

export function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매출</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩{mockStats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +15.3% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 작명 건수</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalNamings}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 결제액</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩{mockStats.avgRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +5.2% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 차트 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>월별 매출 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <Line options={chartOptions} data={revenueData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>서비스별 이용 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar options={chartOptions} data={serviceData} />
          </CardContent>
        </Card>
      </div>

      {/* 최근 작명 리스트 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 작명 리스트</CardTitle>
          <CardDescription>
            최근 등록된 작명 서비스 현황
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>사용자</TableHead>
                <TableHead>서비스 유형</TableHead>
                <TableHead>금액</TableHead>
                <TableHead>날짜</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRecentNamings.map((naming) => (
                <TableRow key={naming.id}>
                  <TableCell className="font-medium">{naming.userName}</TableCell>
                  <TableCell>{naming.servicType}</TableCell>
                  <TableCell>₩{naming.price.toLocaleString()}</TableCell>
                  <TableCell>
                    {format(naming.date, 'yyyy년 MM월 dd일', { locale: ko })}
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      naming.status === "완료" && "bg-green-100 text-green-800",
                      naming.status === "진행중" && "bg-blue-100 text-blue-800",
                      naming.status === "대기중" && "bg-yellow-100 text-yellow-800"
                    )}>
                      {naming.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}