import { MyRange, createRange, getPositions } from "./utils"

export let allRanges: MyRange[] = []

export function setAllranges(all: MyRange[]) {
  allRanges = all
}

export function getScreenPointRangeIdx(query?: string, range?: MyRange) {
  return (
    allRanges.filter((e) => e.query === query).findIndex((e) => e === range) + 1
  )
}

export function getScreenPointRange({
  pageX,
  pageY,
}: {
  pageX: number
  pageY: number
}) {
  return allRanges.find(({ x, y, width, height }) => {
    const xMatch = x <= pageX && pageX <= x + width
    const yMatch = y <= pageY && pageY <= y + height
    return xMatch && yMatch
  })
}

const range: { [s: string]: MyRange[] } = {}
const h: { [s: string]: string } = {}
export function setHighlights(
  query: string,
  txt: string,
  dom: Node,
  currentScroll: number
) {
  const r = addNewSlection().filter(
    ({ y }) => y > currentScroll && y < currentScroll + 1800
  )

  const flag = r.map((e) => e.y).join()
  if (h[query] != flag) {
    h[query] = flag
    ;(CSS as any).highlights.set(query, new (globalThis as any).Highlight(...r))
  }

  function addNewSlection() {
    return (
      range[query] ||
      (range[query] = getPositions(txt, query)
        .map((pos) => createRange(dom, pos, query))
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
            y: y + globalThis.scrollY, // 相对0的绝对距离
            width,
            height,
          })
        }))
    )

    // allRanges.push(...r)
  }
}
