<script setup lang="ts">
import txt from "../txt/天道.txt?raw"

type MyRange = Range & {
  x: number
  y: number
  width: number
  height: number

  nextY: number
  word: string
}

let dom: Node
let allRanges: MyRange[] = []
const selection = getSelection()
const selectedAllTerms = new Set<string>()
let selectedHoverTerm: string
const allRangesObj: { [s: string]: MyRange[] } = {}

setTimeout(() => {
  dom = document.querySelector("article")!.childNodes[0]

  newSearch("小丹")
  newSearch("遥远")
  console.log(allRanges)

  // const r = allWordXYMap.reduce((acc, cur) => {
  //   if (!acc[cur.width]) acc[cur.width] = new Set()
  //   acc[cur.width].add(cur.word)
  //   return acc
  // }, {} as any)

  document.onmousemove = (e) => {
    const r = XY2Range(e)
    if (!r) return

    const h = allRangesObj[r.word]

    ;(CSS as any).highlights.set("hover", HighlightWrap(h))
  }
  document.onclick = (e) => {
    if (selection + "") {
      newSearch(selection + "")
      selection?.empty()
      return
    }

    const r = XY2Range(e)

    r &&
      scrollBy({
        top: r.nextY - r.y,
        behavior: "smooth",
      })
  }
})

function newSearch(query: string) {
  if (query === "") return

  const postions = searchTxt(txt, query)
  const ranges = postions.map((pos) => createRange(pos, query))
  allRangesObj[query] = ranges

  ranges.forEach((range, idx, ranges) => {
    let { x, y, width, height } = range.getBoundingClientRect() // todo 只计算当前屏幕需要的dom
    y += document.documentElement.scrollTop

    range.x = x
    range.y = y
    range.width = width
    range.height = height
    range.word = query
    //
    ;(ranges[idx - 1] || ranges[ranges.length - 1]).nextY = y
  })

  const css = (CSS as any).highlights

  const h = (() => {
    const f = css.get("fixed")

    if (!selectedAllTerms.has(query)) {
      selectedAllTerms.add(query)
      return [...ranges, ...(f || [])]
    } else {
      selectedAllTerms.delete(query)
      return [...f].filter((e: Range) => !postions.includes(e.startOffset))
    }
  })()
  allRanges = h

  css.set("fixed", HighlightWrap(h))
}

function HighlightWrap(h: any[] = []) {
  return new (window as any).Highlight(...h)
}

function createRange(start: number, word: string) {
  const range = new Range() as MyRange
  range.setStart(dom, start)
  range.setEnd(dom, start + word.length)
  return range
}

function XY2Range({ x, y }: { x: number; y: number }) {
  y += document.documentElement.scrollTop
  const word = allRanges.find((range) => {
    const xMatch = range.x <= x && x <= range.x + range.width
    const yMatch = range.y <= y && y <= range.y + range.height
    return xMatch && yMatch
  })

  return word
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

function getPreItem(arr: number[], i: number) {
  return arr[i - 1] || arr[arr.length - 1]
}

function getNextItem(arr: number[], i: number) {
  return arr[i + 1] || arr[0]
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
