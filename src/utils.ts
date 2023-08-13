export function createRange(dom: Node, start: number, query: string) {
  const range = new Range() as MyRange
  const d = dom.childNodes[0]
  range.setStart(d, start)
  range.setEnd(d, start + query.length)
  return range
}

const getPositionsCache: { [s: string]: number[] } = {}
export function getPositions(txt: string, query?: string) {
  if (!query) return []

  if (getPositionsCache[query]) return getPositionsCache[query]

  if (query === "") {
    return []
  }

  const targets = []
  let index = txt.indexOf(query)
  while (index !== -1) {
    targets.push(index)
    index = txt.indexOf(query, index + 1)
  }
  return (getPositionsCache[query] = targets)
}

export type MyRange = Range & {
  x: number
  y: number
  width: number
  height: number

  firstR: MyRange
  lastR: MyRange
  nextR: MyRange
  preR: MyRange

  query: string
}
