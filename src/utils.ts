export function createRange(dom: Node, start: number, query: string) {
  const range = new Range() as MyRange
  const d = dom.childNodes[0]
  range.setStart(d, start)
  range.setEnd(d, start + query.length)
  return range
}

export function getPositions(txt: string, query: string) {
  if (query === "") {
    // console.error("txt")
    return []
  }
  const targets = []
  let index = txt.indexOf(query)
  while (index !== -1) {
    targets.push(index)
    index = txt.indexOf(query, index + 1)
  }
  return targets
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
