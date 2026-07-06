import { useState } from 'react'
import { Layout, Menu, Button, Switch, Space, theme } from 'antd'
import {
  HomeOutlined,
  UnorderedListOutlined,
  PieChartOutlined,
  DownloadOutlined,
  UploadOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SunOutlined,
  MoonOutlined,
  DollarOutlined,
  TagsOutlined,
} from '@ant-design/icons'

const { Sider, Content } = Layout

/**
 * Props passed to the main {@link AppLayout} component.
 *
 * Each callback connects sidebar buttons to actions defined in the parent
 * (App.tsx), so the layout stays a pure shell with no business logic of
 * its own.
 */
interface AppLayoutProps {
  /** Whether the app is in dark mode — controls the theme toggle switch. */
  isDark: boolean
  /** Called when the user flips the dark/light toggle switch. */
  onToggleTheme: () => void
  /** Called when the user clicks the Export button (export expenses as CSV). */
  onExport: () => void
  /** Called when the user clicks the Import button (import expenses from CSV). */
  onImportClick: () => void
  /** The currently active page key — highlights the matching sidebar menu item. */
  activePage: string
  /** Called when the user clicks a sidebar menu item to switch pages. */
  onPageChange: (page: string) => void
  /** Total spending for the current month, displayed at the bottom of the sidebar. */
  monthlyTotal: number
  /** The page content to render in the main area (Dashboard, Expenses, etc.). */
  children: React.ReactNode
}

/**
 * Main layout shell for the entire Personal Finance App.
 *
 * Renders a fixed sidebar on the left with:
 * - The app logo and name
 * - A navigation menu that switches between pages (Dashboard, Expenses,
 *   Analytics, Categories, Snake)
 * - A "This Month" spending total
 * - Buttons to import and export expense data as CSV files
 * - A dark/light theme toggle switch and a collapse button
 *
 * The rest of the page (the main content area) is rendered via
 * `props.children` inside a centered container.
 */
export default function AppLayout({
  isDark,
  onToggleTheme,
  onExport,
  onImportClick,
  activePage,
  onPageChange,
  monthlyTotal,
  children,
}: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { token } = theme.useToken()

  // Menu items for the sidebar navigation. The `key` matches the page name
  // used in App.tsx routing, so clicking an item calls onPageChange(key).
  const menuItems = [
    { key: 'dashboard', icon: <HomeOutlined />, label: 'Dashboard' },
    { key: 'expenses', icon: <UnorderedListOutlined />, label: 'Expenses' },
    { key: 'analytics', icon: <PieChartOutlined />, label: 'Analytics' },
    { key: 'categories', icon: <TagsOutlined />, label: 'Categories' },
    { type: 'divider' as const },
    { key: 'snake', icon: <span className="text-base">🐍</span>, label: 'Snake' },
  ]

  const siderBg = isDark
    ? 'rgba(20, 20, 30, 0.95)'
    : 'rgba(255, 255, 255, 0.85)'
  const borderColor = isDark
    ? 'rgba(255,255,255,0.06)'
    : 'rgba(0,0,0,0.06)'

  return (
    <Layout hasSider>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={220}
        style={{
          background: siderBg,
          backdropFilter: 'blur(20px)',
          borderRight: `1px solid ${borderColor}`,
          height: '100vh',
          position: 'sticky',
          top: 0,
          overflow: 'auto',
        }}
      >
        {/* Use a flex column to stack three sections vertically:
            (1) Logo at the top, (2) Navigation menu in the middle (scrollable),
            (3) Footer at the bottom with totals, import/export, and theme toggle. */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          {/* Section 1 — Logo: shows a "$" icon and the word "Finance" (hidden when collapsed). */}
          <div
            className="flex items-center gap-3 px-4 py-5"
            style={{ borderBottom: `1px solid ${token.colorBorderSecondary}`, flexShrink: 0 }}
          >
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                width: 32, height: 32, background: token.colorPrimary,
                color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0,
              }}
            >
              $
            </div>
            {!collapsed && (
              <span className="font-bold text-base whitespace-nowrap" style={{ color: token.colorText }}>
                Finance
              </span>
            )}
          </div>

          {/* Section 2 — Navigation menu: highlights the current page, scrolls if there
              are too many items to fit. Clicking an item calls onPageChange(key). */}
          <Menu
            mode="inline"
            selectedKeys={[activePage]}
            onClick={({ key }) => onPageChange(key)}
            items={menuItems}
            style={{
              background: 'transparent',
              borderRight: 0,
              marginTop: 8,
              flex: 1,
              overflowY: 'auto',
            }}
          />

          {/* Section 3 — Footer: always pinned at the bottom of the sidebar.
              Contains (in order): this month's spending total, import/export
              buttons, dark/light theme toggle, and sidebar collapse controls. */}
          <div
            className="px-3 py-4"
            style={{ borderTop: `1px solid ${token.colorBorderSecondary}`, flexShrink: 0 }}
          >
            {!collapsed && (
              <div className="mb-3 px-3">
                <div className="text-xs text-gray-400 mb-1">This Month</div>
                <div className="font-bold text-lg" style={{ color: token.colorPrimary }}>
                  <DollarOutlined className="mr-0.5" />
                  {monthlyTotal.toFixed(0)}
                </div>
              </div>
            )}

            <Space orientation="vertical" size={4} className="w-full px-2">
              <Button type="text" block icon={<UploadOutlined />} onClick={onImportClick} className="text-left">
                {!collapsed && 'Import'}
              </Button>
              <Button type="text" block icon={<DownloadOutlined />} onClick={onExport} className="text-left">
                {!collapsed && 'Export'}
              </Button>
            </Space>

            <div className="flex items-center justify-between px-2 mt-3">
              {!collapsed && <span className="text-xs text-gray-400">{isDark ? 'Dark' : 'Light'}</span>}
              <Switch
                size="small"
                checked={isDark}
                onChange={onToggleTheme}
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<SunOutlined />}
              />
              {!collapsed && (
                <Button type="text" size="small" icon={<MenuFoldOutlined />} onClick={() => setCollapsed(true)} />
              )}
            </div>

            {collapsed && (
              <Button type="text" block icon={<MenuUnfoldOutlined />} onClick={() => setCollapsed(false)} className="mt-2" />
            )}
          </div>
        </div>
      </Sider>

      <Content
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0d1f0d 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f0fdf4 100%)',
        }}
      >
        <div className="px-8 py-6 max-w-5xl mx-auto">
          {children}
        </div>
      </Content>
    </Layout>
  )
}
