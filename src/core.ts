import { RemovableRef } from "@vueuse/core"
import { MyRange, getPositions, getScrollPosition } from "./utils"

export type AllWord = { [key: string]: { show: boolean; v: MyRange[] } }

export function getRangeFromPointIdx(
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
    .flatMap((e) => e.v)
}

export function getRangeFromPoint({ x, y }: MouseEvent, allWordValue: AllWord) {
  const { startOffset: idx } = document.caretRangeFromPoint(x, y)!
  const target = getAll(allWordValue).find(
    (e) => e.start <= idx && e.end >= idx
  )

  if (!target) return

  return withFourJumpInfo(target, allWordValue)
}

export function withFourJumpInfo(range: MyRange, allWordValue: AllWord) {
  const ranges = allWordValue[range.query].v

  const idx = ranges.findIndex((e) => e === range)

  const firstR = ranges[0]
  const lastR = ranges.at(-1)
  const preR = ranges.slice(0, idx).findLast((e) => e.y != range.y) || lastR
  const nextR = ranges.slice(idx + 1).find((e) => e.y != range.y) || firstR

  return {
    ...range,
    firstR,
    lastR,
    preR,
    nextR,
  } as MyRange
}

function highlightsSet(query: string, ranges: MyRange[] = []) {
  const R = ranges.map((e) => createRange(e.start, e.end))
  const H = new (window as any).Highlight(...R)
  ;(CSS as any).highlights.set(query, H)
}

export function setQueryHighlights(
  allWord: RemovableRef<{ [key: string]: { show: boolean; v: MyRange[] } }>,
  query: string
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
    .map((start) => createRange(start, start + query.length)) // 这个是不是不需要 使用的时候再create
    .map((range) => {
      const { x, y } = range.getBoundingClientRect() // todo 只计算当前屏幕需要的dom, 这个信息是为了click的时候XY2Range用, 现在暂时用不到

      return Object.assign(range, {
        start: range.startOffset, // 序列号的时候会丢失
        end: range.endOffset,

        query,

        x,
        y: y + getScrollPosition(), // 相对0的绝对距离
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
