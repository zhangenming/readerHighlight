<script setup lang="ts">
import { ref } from "vue"
import 天道 from "../txt/天道.txt?raw"
const refs = ref()
let txt: string
txt =
  "11111111111111111111111111111111111111111111111111111111111111111111调用111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111调用111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111"
txt = 天道.slice(30, 1000)
let allWordXYMap: {
  width: number
  height: number
  x: number
  y: number
  preY?: number
  nextY?: number
  word: string
}[]

setTimeout(() => {
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
      }
    })

  const r = allWordXYMap.reduce((acc, cur) => {
    if (!acc[cur.width]) acc[cur.width] = new Set()
    acc[cur.width].add(cur.word)
    return acc
  }, {} as any)

  console.log(r)

  newSearch("小丹")

  document.onselectionchange = () => {
    newSearch(getSelection() + "")
  }

  document.onclick = (e) => {
    const { y, nextY } = findClickedWord(e)
    console.log(e.y + document.documentElement.scrollTop, y, nextY)

    nextY &&
      scrollBy({
        top: nextY - y,
        behavior: "smooth",
      })
  }
})

function newSearch(query: string) {
  if (query === "") return

  const postions = searchTxt(txt, query)

  postions.forEach((pos, i) => {
    const p = allWordXYMap[getPreItem(postions, i)].y
    const n = allWordXYMap[getNextItem(postions, i)].y
    allWordXYMap.slice(pos, pos + query.length).forEach((target) => {
      target.preY = p
      target.nextY = n
    })
  })

  const css = (CSS as any).highlights
  css.delete("tmp")
  css.set(
    "tmp",
    new (window as any).Highlight(
      ...postions.map((pos) => createRange(pos, query))
    )
  )
  // if (tmp) css.delete(tmp)
  // tmp = query
}

function createRange(start: number, word: string) {
  const dom = document.querySelector("article")!.childNodes[0]
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
  <article
    ref="refs"
    style="font-size: 20px; font-family: Consolas; width: 22em"
  >
    {{ txt }}
  </article>
</template>

<style scoped>
article {
  color: #332a1f;
  white-space: normal;
  word-spacing: unset;
  word-wrap: break-word;
  word-break: break-all;
  /* text-align: justify; */
  line-height: 3em;
}

::highlight(tmp) {
  background-color: #333;
  color: white;
}
/* 开启平滑滚动 */
* {
  scroll-behavior: smooth;
}
</style>
