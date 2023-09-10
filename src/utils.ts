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

// const o = [..._txt].reduce((o, e, i, arr) => {
//   if (!o[e]) o[e] = { l: [], r: [] }

//   const l = arr[i - 1]
//   const r = arr[i + 1]
//   o[e].l.push(l)
//   o[e].r.push(r)
//   return o
// }, {} as { [s: string]: { l: string[]; r: string[] } })

// o.xx
// const t = Object.entries(o).filter(([k, v]) => v.l.length > 10)

// t.forEach(([k, v]) => {
//   if ([...new Set(v.r)].length === 1) {
//     console.log(`${k}->${v.r[0]}`)
//   }
// })

// console.log("\n\n\n")

// t.forEach(([k, v]) => {
//   if ([...new Set(v.l)].length === 1) {
//     console.log(`${v.l[0]}<-${k}`)
//   }
// })

// console.log("\n\n\n")

// t.forEach(([k, v]) => {
//   if ([...new Set(v.r)].length === 1 && [...new Set(v.l)].length === 1) {
//     console.log(`${v.l[0]}<-${k}->${v.r[0]}`)
//   }
// })
