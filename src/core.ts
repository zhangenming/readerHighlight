import { MyRange, getPositions, getScrollPosition } from "./utils"

export function getScreenPointRangeIdx(query?: string, range?: MyRange) {
  return (
    Object.values(rangeCurrentCache)
      .flat()
      .filter((e) => e.query === query)
      .findIndex((e) => e === range) + 1
  )
}

export function getScreenPointRange({
  pageX,
  pageY,
}: {
  pageX: number
  pageY: number
}) {
  return Object.values(rangeCurrentCache)
    .flat()
    .find(({ x, y, width, height }) => {
      const xMatch = x <= pageX && pageX <= x + width
      const yMatch = y <= pageY && pageY <= y + height
      return xMatch && yMatch
    })
}

export function highlightsSet(query: string, value: any = []) {
  const H = new (window as any).Highlight(...value)
  ;(CSS as any).highlights.set(query, H)
}

const rangeCurrentCache: { [key: string]: any } = {}
export function addHighlights(query: string) {
  const scroll = getScrollPosition()
  const current = getWordRange(query).filter(
    ({ y }) => y > scroll && y < scroll + 1800
  )

  if (
    rangeCurrentCache[query]?.map((e: any) => e.y).join() !=
    current.map((e) => e.y).join()
  ) {
    highlightsSet(query, (rangeCurrentCache[query] = current))
  }
}

function getWordRange(query: string) {
  return getPositions(query)
    .map((start) => createRange(start, start + query.length))
    .map((range, idx, ranges) => {
      const firstR = ranges[0]
      const lastR = ranges[ranges.length - 1]

      const { x, y, width, height } = range.getBoundingClientRect() // todo 只计算当前屏幕需要的dom, 这个信息是为了click的时候XY2Range用, 现在暂时用不到

      return Object.assign(range, {
        query,

        firstR,
        lastR,
        preR: ranges[idx - 1] || lastR,
        nextR: ranges[idx + 1] || firstR,

        x,
        y: y + getScrollPosition(), // 相对0的绝对距离
        width,
        height,
      })
    })
}

function createRange(start: number, end: number) {
  const { textDom } = window as any
  const range = new Range()
  range.setStart(textDom, start)
  range.setEnd(textDom, end)
  return range
}
