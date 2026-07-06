import { Skeleton, Card } from 'antd'

export function StatsBarSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} size="small">
          <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
        </Card>
      ))}
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton active paragraph={{ rows: 8 }} />
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <Card>
      <Skeleton active paragraph={{ rows: 1 }} title={{ width: '30%' }} />
      <div className="flex items-center justify-center h-[420px]">
        <Skeleton.Node active style={{ width: 300, height: 300 }}>
          <div className="w-[300px] h-[300px] rounded-full" />
        </Skeleton.Node>
      </div>
    </Card>
  )
}

export function DashboardSkeleton() {
  return (
    <div>
      <Skeleton
        active
        paragraph={{ rows: 1 }}
        title={{ width: '50%' }}
        className="mb-6"
      />
      <StatsBarSkeleton />
      <Card className="mb-4">
        <Skeleton active paragraph={{ rows: 5 }} />
      </Card>
    </div>
  )
}
