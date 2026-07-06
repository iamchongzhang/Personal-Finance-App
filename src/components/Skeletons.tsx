/**
 * Skeleton Components — Placeholder UI for Loading States
 *
 * "Skeleton" components are animated gray placeholders that appear while
 * real content is loading. They show the approximate shape and layout of the
 * content that will eventually appear. This prevents the screen from jumping
 * around or looking broken while data is being fetched from the database.
 *
 * Think of them like a wireframe preview: the user sees where things will go,
 * and the animation signals "data is on its way."
 */

import { Skeleton, Card } from 'antd'

/**
 * Placeholder for the StatsBar (the four stat cards at the top of the Dashboard).
 *
 * Renders a 4-column grid of small cards, each containing a single-line
 * skeleton. Used while the Dashboard is loading expense data for the first time.
 */
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

/**
 * Placeholder for a data table (e.g., the full expense list).
 *
 * Renders a block with 8 skeleton rows to mimic the height of a paginated
 * table. Used while the ExpenseList is fetching expense records.
 */
export function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton active paragraph={{ rows: 8 }} />
    </div>
  )
}

/**
 * Placeholder for a pie/donut chart (used on the Charts/Reports page).
 *
 * Renders a card with a title skeleton at the top and a large circular
 * skeleton in the center, mimicking a donut chart before the real SVG is ready.
 */
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

/**
 * Placeholder for the entire Dashboard page.
 *
 * Composes the greeting skeleton, the StatsBar skeleton, and a card skeleton
 * (for recent expenses) into one full-page loading state. This is shown when
 * the Dashboard first mounts and is waiting on the database query.
 */
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
