let txt: string // 省略以后每次都要传参, 因为setup没办法export 所以这里只好使用这种方式
export function setTxt(_txt: string) {
  txt = _txt
}

export const getPositions = function getPositions(query?: string) {
  if (!query || query === "") return []

  const targets = []
  let index = txt.indexOf(query)
  while (index !== -1) {
    targets.push(index)
    index = txt.indexOf(query, index + 1)
  }
  return targets
}

function withCache<T extends (...args: any[]) => any>(
  fn: T,
  getFlag = (...args: any[]) => args[0]
): (...args: Parameters<T>) => ReturnType<T> {
  const cache: { [key: string]: any } = {}

  return (...args: Parameters<T>): ReturnType<T> => {
    const flag = getFlag()

    return cache[flag] || (cache[flag] = fn(...args))
  }
}

export type MyRange = Range & {
  start: number
  end: number

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

export function getScrollPosition() {
  return window.scrollY
}
export function setScrollPosition(top: number, behavior?: ScrollBehavior) {
  window.scrollTo({ top, behavior })
}
