<script setup lang="ts">
import txt from "../txt/天道.txt?raw"

type MyRange = Range & {
  x: number
  y: number
  width: number
  height: number

  firstY: number
  lastY: number
  nextY: number
  preY: number
  query: string
}

const selection = getSelection()

let dom: Node
let allRanges: MyRange[] = []
const allRangesObj: { [s: string]: MyRange[] } = {}
const selectedAllTerms = new Set<string>()
let selectedHoverTerms: string

setTimeout(() => {
  dom = document.querySelector("article")!.childNodes[0]

  newSearch("小丹")
  newSearch("遥远")

  document.onmousemove = (e) => {
    const r = XY2Range(e)
    if (!r) return

    const query = r.query
    if (query === selectedHoverTerms) return
    selectedHoverTerms = query
    const h = allRangesObj[query]
    HighlightWrap("hover", h)
  }

  document.onclick = ({ x, y, shiftKey, ctrlKey }) => {
    const s = selection + ""
    selection?.empty()

    if (s) {
      return newSearch(s)
    }

    const r = XY2Range({ x, y })
    if (!r) return

    scrollBy({
      behavior: "smooth",
      top:
        (ctrlKey
          ? r[shiftKey ? "firstY" : "lastY"]
          : r[shiftKey ? "preY" : "nextY"]) - r.y,
    })
  }
})

function newSearch(query: string) {
  if (query === "" || query.includes("\n")) return

  const postions = searchTxt(txt, query)
  const ranges = postions.map((pos) => createRange(pos, query))

  ranges.forEach((range) => {
    let { x, y, width, height } = range.getBoundingClientRect() // todo 只计算当前屏幕需要的dom, 这个信息是为了click的时候XY2Range用, 现在暂时用不到
    y += document.documentElement.scrollTop

    Object.assign(range, {
      x,
      y,
      width,
      height,
      query,
    })
  })
  ranges.forEach((range, idx, ranges) => {
    const firstR = ranges[0]
    const lastR = ranges[ranges.length - 1]
    range.firstY = firstR.y
    range.lastY = lastR.y
    range.preY = (ranges[idx - 1] || lastR).y
    range.nextY = (ranges[idx + 1] || firstR).y
    // ;(ranges[idx + 1] || firstR).preY = y
    // ;(ranges[idx - 1] || lastR).nextY = y
  })

  allRangesObj[query] = ranges

  allRanges = (() => {
    const f = HighlightWrap("fixed")

    if (!selectedAllTerms.has(query)) {
      selectedAllTerms.add(query)
      return [...ranges, ...(f || [])]
    } else {
      selectedAllTerms.delete(query)
      return [...f].filter((e: Range) => !postions.includes(e.startOffset))
    }
  })()

  HighlightWrap("fixed", allRanges)
}

function XY2Range({ x, y }: { x: number; y: number }) {
  y += document.documentElement.scrollTop
  return allRanges.find((range) => {
    const xMatch = range.x <= x && x <= range.x + range.width
    const yMatch = range.y <= y && y <= range.y + range.height
    return xMatch && yMatch
  })
}

function HighlightWrap(key: string, h?: MyRange[]) {
  const highlights = (CSS as any).highlights

  if (h) {
    console.log("set", key, h)

    highlights.set(key, new (window as any).Highlight(...h))
  } else {
    return highlights.get(key)
  }
}

function createRange(start: number, query: string) {
  const range = new Range() as MyRange
  range.setStart(dom, start)
  range.setEnd(dom, start + query.length)
  return range
}

function searchTxt(txt: string, search: string) {
  const targets = []
  let index = txt.indexOf(search)
  while (index !== -1) {
    targets.push(index)
    index = txt.indexOf(search, index + 1)
  }
  return targets
}
</script>

<template>
  <article>
    {{ txt }}
  </article>
</template>

<style scoped>
article {
  color: #fff;
  white-space: break-spaces;
  word-spacing: unset;
  word-wrap: break-word;
  word-break: break-all;
  /* text-align: justify; */
  /* line-height: 1em; */
  font-size: 20px;
  /* font-family: Consolas; */
  /* width: 22em; */
}

::highlight(fixed) {
  color: #eee;
}
::highlight(hover) {
  color: #111;
}
/* 开启平滑滚动 */
* {
  scroll-behavior: smooth;
}
</style>
