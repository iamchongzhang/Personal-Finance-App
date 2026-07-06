import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Card } from 'antd'
import { TrophyOutlined } from '@ant-design/icons'

// ── Game Constants ────────────────────────────────────────────
const GRID_SIZE = 20
const CELL_SIZE = 20
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE // 400px
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE // 400
const INITIAL_SPEED = 140 // ms per tick
const SPEED_INCREMENT = 3 // ms faster per food eaten
const MIN_SPEED = 50
const INITIAL_SNAKE_LENGTH = 3

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type Position = { x: number; y: number }

interface GameState {
  snake: Position[]
  food: Position
  direction: Direction
  nextDirection: Direction
  score: number
  gameOver: boolean
  started: boolean
  paused: boolean
  speed: number
}

const DIRECTION_VECTORS: Record<Direction, Position> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
}

const OPPOSITE: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
}

// Eye offset lookup — eliminates 4 if/else branches
const EYE_OFFSETS: Record<Direction, { ex1: number; ey1: number; ex2: number; ey2: number }> = {
  RIGHT: { ex1: 4, ey1: -4, ex2: 4, ey2: 4 },
  LEFT: { ex1: -4, ey1: -4, ex2: -4, ey2: 4 },
  UP: { ex1: -4, ey1: -4, ex2: 4, ey2: -4 },
  DOWN: { ex1: -4, ey1: 4, ex2: 4, ey2: 4 },
}

// ── Helpers ────────────────────────────────────────────────────

/** Factory: creates a fresh initial game state (single source of truth). */
function createInitialState(): GameState {
  const startX = Math.floor(GRID_SIZE / 2)
  const startY = Math.floor(GRID_SIZE / 2)
  const snake: Position[] = []
  for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
    snake.push({ x: startX - i, y: startY })
  }
  return {
    snake,
    direction: 'RIGHT',
    nextDirection: 'RIGHT',
    score: 0,
    gameOver: false,
    started: false,
    paused: false,
    speed: INITIAL_SPEED,
    food: randomFood(snake),
  }
}

function randomFood(snake: Position[]): Position {
  // Bail-out: if snake fills nearly the entire grid, player has won.
  // Avoid infinite loop by checking free-cell count.
  if (snake.length >= TOTAL_CELLS) {
    // Return any position — tick will detect wall collision or self-collision
    // before calling randomFood, so this is an extreme edge case.
    return { x: 0, y: 0 }
  }

  const occupied = new Set(snake.map((s) => `${s.x},${s.y}`))
  const freeCount = TOTAL_CELLS - occupied.size
  let attempts = 0
  const maxAttempts = Math.min(freeCount * 10, 1000)

  let pos: Position
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    }
    attempts++
    // Safety valve: if we've tried too many times, fall back to linear scan
    if (attempts > maxAttempts) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (!occupied.has(`${x},${y}`)) {
            return { x, y }
          }
        }
      }
      return { x: 0, y: 0 } // never reached — all cells occupied
    }
  } while (occupied.has(`${pos.x},${pos.y}`))
  return pos
}

function isOpposite(a: Direction, b: Direction): boolean {
  return OPPOSITE[a] === b
}

// ── Component ──────────────────────────────────────────────────

interface SnakeGameProps {
  isDark: boolean
}

export default function SnakeGame({ isDark }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dprRef = useRef(1) // devicePixelRatio, set on mount

  // Single source of truth for mutable game state
  const gameStateRef = useRef<GameState>(createInitialState())

  // React state: mirrors gameStateRef fields needed for rendering
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    try { return Number(localStorage.getItem('snake_high_score')) || 0 }
    catch { return 0 }
  })
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)

  // Ref for highScore so endGame/tick never read a stale closure value
  const highScoreRef = useRef(highScore)
  useEffect(() => {
    highScoreRef.current = highScore
  }, [highScore])

  // ── Theme colours (memoized — only recomputes on theme change) ─
  const colors = useMemo(() => ({
    bg: isDark ? '#1a1a2e' : '#f0fdf4',
    grid: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)',
    snakeHead: isDark ? '#4ade80' : '#16a34a',
    snakeBody: isDark ? '#22c55e' : '#22c55e',
    food: isDark ? '#fb7185' : '#e11d48',
    overlayText: '#fff',
  }), [isDark])

  // ── High-DPI canvas setup ────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    dprRef.current = dpr

    const cssSize = CANVAS_SIZE
    canvas.style.width = `${cssSize}px`
    canvas.style.height = `${cssSize}px`
    canvas.width = cssSize * dpr
    canvas.height = cssSize * dpr

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
    }
  }, [])

  // ── Draw ───────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Reset transform for this frame (in case DPR changed, re-apply)
    ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0)

    const gs = gameStateRef.current

    // Clear
    ctx.fillStyle = colors.bg
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Grid lines
    ctx.strokeStyle = colors.grid
    ctx.lineWidth = 0.5
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE)
      ctx.stroke()
    }

    // Food (pulsing circle)
    const pulse = 0.85 + 0.15 * Math.sin(Date.now() / 300)
    const fx = gs.food.x * CELL_SIZE + CELL_SIZE / 2
    const fy = gs.food.y * CELL_SIZE + CELL_SIZE / 2
    const fr = (CELL_SIZE / 2 - 2) * pulse

    // Food base
    ctx.save()
    ctx.fillStyle = colors.food
    ctx.beginPath()
    ctx.arc(fx, fy, fr, 0, Math.PI * 2)
    ctx.fill()

    // Food glow
    ctx.shadowColor = colors.food
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(fx, fy, fr, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore() // resets shadowColor, shadowBlur, and fillStyle

    // Snake
    gs.snake.forEach((seg, i) => {
      const padding = i === 0 ? 0 : 1
      const x = seg.x * CELL_SIZE + padding
      const y = seg.y * CELL_SIZE + padding
      const w = CELL_SIZE - padding * 2
      const h = CELL_SIZE - padding * 2
      const radius = i === 0 ? 5 : 4

      ctx.fillStyle = i === 0 ? colors.snakeHead : colors.snakeBody

      // Rounded rectangle
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + w - radius, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
      ctx.lineTo(x + w, y + h - radius)
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
      ctx.lineTo(x + radius, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
      ctx.fill()

      // Eyes on head
      if (i === 0) {
        const cx = seg.x * CELL_SIZE + CELL_SIZE / 2
        const cy = seg.y * CELL_SIZE + CELL_SIZE / 2
        const off = EYE_OFFSETS[gs.direction]

        ctx.fillStyle = '#fff'
        const eyeSize = 3
        ctx.beginPath()
        ctx.arc(cx + off.ex1, cy + off.ey1, eyeSize, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(cx + off.ex2, cy + off.ey2, eyeSize, 0, Math.PI * 2)
        ctx.fill()

        // Pupils
        ctx.fillStyle = '#111'
        const pupilSize = 1.5
        ctx.beginPath()
        ctx.arc(cx + off.ex1, cy + off.ey1, pupilSize, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(cx + off.ex2, cy + off.ey2, pupilSize, 0, Math.PI * 2)
        ctx.fill()
      }
    })

    // Overlays
    if (gs.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      ctx.fillStyle = colors.overlayText
      ctx.font = 'bold 28px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Game Over', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 10)
      ctx.font = '14px Inter, sans-serif'
      ctx.fillText(`Score: ${gs.score}`, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 24)
      ctx.fillText('Press Space or click to restart', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 46)
    } else if (!gs.started) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      ctx.fillStyle = colors.overlayText
      ctx.font = 'bold 24px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('🐍 Snake', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 8)
      ctx.font = '14px Inter, sans-serif'
      ctx.fillText('Arrow keys or WASD to move', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 22)
      ctx.fillText('Press Space or click to start', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 44)
    } else if (gs.paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      ctx.fillStyle = colors.overlayText
      ctx.font = 'bold 24px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Paused', CANVAS_SIZE / 2, CANVAS_SIZE / 2)
      ctx.font = '14px Inter, sans-serif'
      ctx.fillText('Press Space to resume', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 26)
    }
  }, [colors])

  // ── Game tick ──────────────────────────────────────────────

  const tick = useCallback(() => {
    const gs = gameStateRef.current
    if (!gs.started || gs.gameOver || gs.paused) return

    // Guard: snake should never be empty during active gameplay
    if (gs.snake.length === 0) return

    // Commit direction
    gs.direction = gs.nextDirection

    const head = gs.snake[0]
    const vec = DIRECTION_VECTORS[gs.direction]
    const newHead: Position = { x: head.x + vec.x, y: head.y + vec.y }

    // Wall collision
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      endGame()
      return
    }

    // Self collision (skip tail, which will be removed unless eating)
    const willEat = newHead.x === gs.food.x && newHead.y === gs.food.y
    const checkBody = willEat ? gs.snake : gs.snake.slice(0, -1)
    if (checkBody.some((s) => s.x === newHead.x && s.y === newHead.y)) {
      endGame()
      return
    }

    // Move
    gs.snake = [newHead, ...gs.snake]

    if (willEat) {
      gs.score += 1
      gs.speed = Math.max(MIN_SPEED, gs.speed - SPEED_INCREMENT)
      gs.food = randomFood(gs.snake)
      setScore(gs.score)
    } else {
      gs.snake.pop()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // endGame: uses highScoreRef to avoid stale closure
  function endGame() {
    const gs = gameStateRef.current
    gs.gameOver = true
    setGameOver(true)

    if (gs.score > highScoreRef.current) {
      setHighScore(gs.score)
      try { localStorage.setItem('snake_high_score', String(gs.score)) } catch { /* noop */ }
    }
  }

  // ── Start / Reset ──────────────────────────────────────────

  const initGame = useCallback(() => {
    const fresh = createInitialState()
    fresh.started = true // initGame always means "start playing now"
    gameStateRef.current = fresh

    setScore(0)
    setGameOver(false)
    setStarted(true)
    setPaused(false)
  }, [])

  // ── Single game loop ───────────────────────────────────────
  // One interval for both tick and draw. Speed changes (score dep)
  // cause a clean restart at the new rate. Tick returns early when
  // game is inactive; draw always runs for the pulsing food animation.

  useEffect(() => {
    const id = setInterval(() => {
      tick()
      draw()
    }, gameStateRef.current.speed)

    return () => clearInterval(id)
  }, [started, gameOver, paused, score, tick, draw])

  // ── Keyboard ───────────────────────────────────────────────

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const gs = gameStateRef.current

      // Start / restart / pause
      if (e.code === 'Space') {
        e.preventDefault()
        if (gs.gameOver) { initGame(); return }
        if (!gs.started) { initGame(); return }
        gs.paused = !gs.paused
        setPaused(gs.paused)
        return
      }

      // Direction
      const keyMap: Record<string, Direction> = {
        ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
        KeyW: 'UP', KeyS: 'DOWN', KeyA: 'LEFT', KeyD: 'RIGHT',
      }
      const dir = keyMap[e.code]
      if (dir && !isOpposite(dir, gs.direction)) {
        e.preventDefault()
        gs.nextDirection = dir
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [initGame])

  // ── Click to start/restart ─────────────────────────────────

  const handleCanvasClick = useCallback(() => {
    const gs = gameStateRef.current
    if (gs.gameOver || !gs.started) {
      initGame()
    }
  }, [initGame])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Snake</h1>
          <p className="text-gray-500 mt-1">
            A classic retro game — use arrow keys or WASD to move.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center">
        {/* Score display */}
        <div className="flex gap-8 mb-4">
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Score</div>
            <div className="text-2xl font-bold" style={{ color: '#16a34a' }}>{score}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wide">
              <TrophyOutlined className="mr-1" />
              Best
            </div>
            <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{highScore}</div>
          </div>
        </div>

        {/* Canvas */}
        <Card
          className="overflow-hidden"
          styles={{ body: { padding: 0 } }}
        >
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            style={{ display: 'block', cursor: 'pointer', width: CANVAS_SIZE, height: CANVAS_SIZE }}
          />
        </Card>

        {/* Controls hint */}
        <div className="mt-4 flex gap-6 text-xs text-gray-400">
          <span>⬆⬇⬅➡ or WASD: Move</span>
          <span>Space: {started && !gameOver ? 'Pause' : 'Start'}</span>
        </div>
      </div>
    </div>
  )
}
