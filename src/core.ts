import { MyRange, getPositions, getScrollPosition } from "./utils"
import store from "./store/store"

function getAll() {
  return Object.values(store.allWord)
    .filter((e) => e.show)
    .flatMap((e) => e.v)
}

export function getRangeFromPointIdx(query: string, range: MyRange) {
  return (
    getAll()
      .filter((e) => e.query === query)
      .findIndex((e) => e === range) + 1
  )
}

export function getPositionFromPoint({ x, y }: MouseEvent) {
  const curentRange = document.caretRangeFromPoint(x, y)
  if (!curentRange) return

  const idx = curentRange.startOffset
  const ps = getAll().find((e) => e.start <= idx && e.end >= idx)

  if (!ps) return

  return withFourJumpInfo(ps)
}

export function withFourJumpInfo(ps: MyRange) {
  const ranges = store.allWord[ps.query].v

  const idx = ranges.findIndex((e) => e === ps)

  const firstR = ranges[0]
  const lastR = ranges.at(-1)
  const preR = ranges.slice(0, idx).findLast((e) => e.y != ps.y) || lastR
  const nextR = ranges.slice(idx + 1).find((e) => e.y != ps.y) || firstR

  return {
    ...ps,
    firstR,
    lastR,
    preR,
    nextR,
  } as MyRange
}

export function setHighlights(query?: string, ranges?: MyRange[]) {
  if (query && ranges) {
    colorQuery(query, ranges) // 现在用不到了 全部全量更新
  } else {
    Object.entries(store.allWord).forEach(([q, { show, v }]) =>
      colorQuery(q, show ? v : [])
    )
  }

  function colorQuery(query: string, value: MyRange[]) {
    const scroll = getScrollPosition()
    const screenRanges = value.filter(
      ({ y }) => y > scroll && y < scroll + 1800
    )

    const R = screenRanges.map(createRange)
    const H = new (window as any).Highlight(...R)
    ;(CSS as any).highlights.set(query, H)
  }
}

export function geneNewQueryRange(query: string) {
  return getPositions(query)
    .map((start) => createRange({ start, end: start + query.length })) // 这个是不是不需要 使用的时候再create
    .map((range) => {
      const { x, y } = range.getBoundingClientRect() // todo 只计算当前屏幕需要的dom, 这个信息是为了click的时候XY2Range用, 现在暂时用不到

      return Object.assign(range, {
        start: range.startOffset, // 原对象序列号的时候会丢失, 所以这里手动
        end: range.endOffset,

        query,

        x,
        y: y + getScrollPosition(), // 相对0的绝对距离
      }) as MyRange
    })
}

function createRange({ start, end }: { start: number; end: number }) {
  const { textDom } = store

  const range = new Range()
  range.setStart(textDom!, start)
  range.setEnd(textDom!, end)
  return range
}
