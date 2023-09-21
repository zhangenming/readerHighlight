import { RemovableRef } from "@vueuse/core"
import { MyRange, getPositions, getScrollPosition } from "./utils"

export type AllWord = { [key: string]: { show: boolean; v: MyRange[] } }

export function getScreenPointRangeIdx(
  query: string,
  range: MyRange,
  allWordValue: AllWord
) {
  return (
    getAll(allWordValue)
      .filter((e) => e.query === query)
      .findIndex((e) => e === range) + 1
  )
}

function getAll(allWordValue: AllWord) {
  return Object.values(allWordValue)
    .filter((e) => e.show)
    .map((e) => e.v)
    .flat()
}

export function getScreenPointRange(
  { pageX, pageY }: { pageX: number; pageY: number },
  allWordValue: AllWord
) {
  const target = getAll(allWordValue).find(({ x, y, width, height }) => {
    const xMatch = x <= pageX && pageX <= x + width
    const yMatch = y <= pageY && pageY <= y + height
    return xMatch && yMatch
  })

  if (!target) return

  return withRelation(target, allWordValue)
}

export function withRelation(range: MyRange, allWordValue: AllWord) {
  const ranges = allWordValue[range.query].v

  const idx = ranges.findIndex((e) => e === range)

  const firstR = ranges[0]
  const lastR = ranges.at(-1)

  return {
    ...range,
    firstR,
    lastR,
    preR: ranges[idx - 1] || lastR,
    nextR: ranges[idx + 1] || firstR,
  } as MyRange
}

function highlightsSet(query: string, ranges: MyRange[] = []) {
  const R = ranges.map((e) => createRange(e.start, e.end))
  const H = new (window as any).Highlight(...R)
  ;(CSS as any).highlights.set(query, H)
}

export function setQueryHighlights(
  query: string,
  allWord: RemovableRef<{ [key: string]: { show: boolean; v: MyRange[] } }>
) {
  const { show, v } = allWord.value[query]

  const scroll = getScrollPosition()
  const screenRanges = show
    ? v.filter(({ y }) => y > scroll && y < scroll + 1800)
    : []

  highlightsSet(query, screenRanges)
}

export function geneNewQueryRange(query: string) {
  return getPositions(query)
    .map((start) => createRange(start, start + query.length))
    .map((range, idx, ranges) => {
      const firstR = ranges[0]
      const lastR = ranges.at(-1)

      const { x, y, width, height } = range.getBoundingClientRect() // todo 只计算当前屏幕需要的dom, 这个信息是为了click的时候XY2Range用, 现在暂时用不到

      return Object.assign(range, {
        start: range.startOffset,
        end: range.endOffset,

        query,

        // firstR,
        // lastR,
        // preR: ranges[idx - 1] || lastR,
        // nextR: ranges[idx + 1] || firstR,

        x,
        y: y + getScrollPosition(), // 相对0的绝对距离
        width,
        height,
      }) as MyRange
    })
}

function createRange(start: number, end: number) {
  const { textDom } = window as any
  const range = new Range()
  range.setStart(textDom, start)
  range.setEnd(textDom, end)
  return range
}
