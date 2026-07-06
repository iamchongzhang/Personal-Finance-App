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

interface AppLayoutProps {
  isDark: boolean
  onToggleTheme: () => void
  onExport: () => void
  onImportClick: () => void
  activePage: string
  onPageChange: (page: string) => void
  monthlyTotal: number
  children: React.ReactNode
}

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

  const menuItems = [
    { key: 'dashboard', icon: <HomeOutlined />, label: 'Dashboard' },
    { key: 'expenses', icon: <UnorderedListOutlined />, label: 'Expenses' },
    { key: 'analytics', icon: <PieChartOutlined />, label: 'Analytics' },
    { key: 'categories', icon: <TagsOutlined />, label: 'Categories' },
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
        {/* Use flex column to properly stack header, menu, and footer */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          {/* Logo */}
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

          {/* Menu — scrollable */}
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

          {/* Bottom section — fixed to bottom */}
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
