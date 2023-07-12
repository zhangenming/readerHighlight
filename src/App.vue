<script setup lang="ts">
import 天道 from "../txt/天道.txt?raw"
let txt: string
txt =
  "11111111111111111111111111111111111111111111111111111111111111111111调用111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111调用111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111"
txt = 天道.slice(0, 1e4)
let allWordXYMap: {
  width: number
  height: number
  x: number
  y: number
  preY?: number
  nextY?: number
  word: string
}[]

const selection = getSelection()
const selectedTerms = new Set<string>()
let dom: Node

setTimeout(() => {
  dom = document.querySelector("article")!.childNodes[0]

  allWordXYMap = [...txt]
    .map((word, pos) => [word, createRange(pos, word)] as const)
    .map(([word, range]) => {
      const { x, y, width } = range.getBoundingClientRect()

      return {
        x,
        y: y + document.documentElement.scrollTop,
        width,
        height: 26,
        word,
        range,
      }
    })

  console.log(allWordXYMap)

  newSearch("小丹", true)
  newSearch("丁元英", true)

  // const r = allWordXYMap.reduce((acc, cur) => {
  //   if (!acc[cur.width]) acc[cur.width] = new Set()
  //   acc[cur.width].add(cur.word)
  //   return acc
  // }, {} as any)

  // document.onmousemove = () => {
  //   newSearch(selection + "")
  // }
  document.onclick = (e) => {
    if (selection + "") {
      newSearch(selection + "", true)
      selection?.empty()
      return
    }

    const { y, nextY } = findClickedWord(e)

    nextY &&
      scrollBy({
        top: nextY - y,
        behavior: "smooth",
      })
  }
})

function newSearch(query: string, isFiexd?: boolean) {
  if (query === "") return

  const postions = searchTxt(txt, query)
  const ranges = postions.map((pos) => createRange(pos, query))

  postions.forEach((pos, i) => {
    const p = allWordXYMap[getPreItem(postions, i)].y
    const n = allWordXYMap[getNextItem(postions, i)].y
    allWordXYMap.slice(pos, pos + query.length).forEach((target) => {
      target.preY = p
      target.nextY = n
    })
  })

  const css = (CSS as any).highlights
  if (isFiexd) {
    if (selectedTerms.has(query)) {
      selectedTerms.delete(query)
      css.set(
        "fixed",
        _Highlight(
          [...css.get("fixed")].filter(
            (e: Range) => !postions.includes(e.startOffset)
          )
        )
      )
      return
    } else {
      selectedTerms.add(query)
      css.set("fixed", _Highlight(ranges, css.get("fixed")))
    }
  } else {
    css.set("tmp", _Highlight(ranges))
  }
}

function _Highlight(x: any[] = [], y: any[] = []) {
  return new (window as any).Highlight(...x, ...y)
}

function createRange(start: number, word: string) {
  const range = new Range()
  range.setStart(dom, start)
  range.setEnd(dom, start + word.length)
  return range
}

function findClickedWord({ x, y }: { x: number; y: number }) {
  y += document.documentElement.scrollTop
  const word = allWordXYMap.find((w) => {
    const xMatch = w.x <= x && x <= w.x + w.width
    const yMatch = w.y <= y && y <= w.y + w.height
    return xMatch && yMatch
  })
  return word || ({} as (typeof allWordXYMap)[0])
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
  color: #332a1f;
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

::highlight(tmp) {
  background-color: #333;
  color: white;
}
::highlight(fixed) {
  background-color: #333;
  color: white;
}
/* 开启平滑滚动 */
* {
  scroll-behavior: smooth;
}
</style>
