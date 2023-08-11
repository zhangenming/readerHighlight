<!-- 应用逻辑 vue逻辑分离 -->
<script setup lang="ts">
import { useLocalStorage } from "@vueuse/core"
import { ref, computed, watchEffect, onMounted, watch, nextTick } from "vue"
import { MyRange, createRange, getPositions } from "./utils"
import _txt from "../txt/史蒂夫·乔布斯传.txt?raw"

const len = new URL(window.location + "").searchParams.get("len")
let txt = _txt
txt = len ? _txt.slice(0, 1e5 * Number(len)) : _txt
txt.length.xx

const selection = getSelection()
const dom = ref<Node>()

// vue reactivity...
const allWord = useLocalStorage("allWord", new Set<string>())
onMounted(() => {
  allWord.value.forEach((word) => setHighlights(word))
})

const hoverWord = ref()

const allRanges: MyRange[] = []

const jumpTargetRange = ref<MyRange>()

// event
let clientY = 0
document.onclick = (e) => {
  const query = selection + ""
  selection?.empty()

  if (query) {
    if (query === "" || query.includes("\n")) return

    if (allWord.value.has(query)) {
      del(query)
      return
    }

    allWord.value.add(query)
    setHighlights(query)

    const len = getPositions(txt, query).length
    if (len === 1) {
      setTimeout(() => del(query), 200)
    }

    document.title = len + ""
    return

    function del(query: string) {
      allWord.value.delete(query)
      ;(CSS as any).highlights.set(query, new (globalThis as any).Highlight())
    }
  }

  clientY = e.clientY
  const r = getScreenPointRange(e)

  if (!r) return

  jumpRange(r, e)

  // setHighlightColor(
  //   "clickSelection",
  //   allRanges.filter((e) => e.query === r.query),
  //   3
  // )
}

// 文本量多少 渲染量多少(本word/全word) 是否第一次
//  1   2   4   8
//  50  200 800 1600
//  16  50  200

let w = ""
document.onmousemove = (evt) => {
  const word = getScreenPointRange(evt)?.query || ""
  if (w === word) return
  w = word

  hoverWord.value = word
  // setHighlights(word, "hover")

  // const t = +new Date()
  // setTimeout(() => {
  //   document.title = +new Date() - t + ""
  // })
  // nextTick(() => {
  //   document.title = +new Date() - t
  // })
  // requestIdleCallback(() => {
  //   document.title = +new Date() - t
  // })
}

document.onkeydown = (e) => {
  if (e.altKey) {
    e.preventDefault()
    jumpRange(jumpTargetRange.value!, e)
  }
}

// scroll...
const scrollTop = useLocalStorage<number>("scrollTop", null)
onMounted(() => {
  globalThis.scrollTo({ top: scrollTop.value, behavior: "smooth" })
})
document.onscroll = () => {
  scrollTop.value = globalThis.scrollY
}

let pos = scrollY
function jumpRange(
  currentR: MyRange,
  { ctrlKey, shiftKey }: KeyboardEvent | MouseEvent
) {
  const type = ctrlKey
    ? shiftKey
      ? "firstR"
      : "lastR"
    : shiftKey
    ? "preR"
    : "nextR"

  jumpTargetRange.value = currentR[type]

  // globalThis.scrollTo({
  //   top: pos,
  // })
  // const top = nextR.y - currentR.y
  // pos = top + scrollY
  // scrollBy({
  //   behavior: "smooth",
  //   top,
  // })

  globalThis.scrollTo({
    behavior: "smooth",
    top: jumpTargetRange.value.y - clientY, // + (scrollY % 26),
  })
}

// hack event
function getScreenPointRange({
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

type ValidKeys = "hover" | "clickSelection" | "jumpTargetRange" | "all"

const styleHighlightCache: { [s in ValidKeys]: { [s: string]: any } } = {
  hover: {},
  clickSelection: {},
  jumpTargetRange: {},
  all: {},
}

function setHighlightColor(
  key: ValidKeys,
  h: MyRange[],
  priority?: number,
  hoverValue: string = "x"
) {
  if (key === "hover") {
    if (styleHighlightCache.hover.now === hoverValue) return

    const H = styleHighlightCache.hover[hoverValue]
    if (H) {
      ;(CSS as any).highlights.set(key, H.xx)
      styleHighlightCache.hover.now = hoverValue
      return
    }
  }

  const H = new (globalThis as any).Highlight(...h)
  H.priority = priority
  ;(CSS as any).highlights.set(key, H)

  if (key === "hover") {
    styleHighlightCache.hover[hoverValue] = H
    styleHighlightCache.hover.now = hoverValue
  }
}

const c: any = {}
function setHighlights(word: string, key = word) {
  if (c[word]) {
    ;(CSS as any).highlights.set(key, c[word])
    return
  }

  const ranges = addNewSlection(word)
  const H = new (globalThis as any).Highlight(...ranges)
  ;(CSS as any).highlights.set(key, H)

  c[word] = H

  function addNewSlection(query: string) {
    const r = getPositions(txt, query)
      .map((pos) => createRange(dom.value!, pos, query))
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
      })

    allRanges.push(...r)
    return r
  }
}

const boss = false
const z = boss ? `{color: #eee;}` : `{ color: red; }`
const x = boss ? `{color: #eee;}` : `{ color: #fff;background: red; }`
</script>

<template>
  <article ref="dom">
    {{ txt }}
  </article>

  <component is="style" v-for="word of allWord">
    article::highlight({{ word }}) {{ z }}
  </component>
  <component is="style">
    article::highlight({{ hoverWord }}) {{ x }}
  </component>

  <component is="style"> article::highlight(hover) {color: #333;} </component>

  <!-- <component is="style" v-for="w of allWord" :key="w">
    article::highlight({{ w }}) {color:
    {{ w === hoverWord ? "#333" : "#eee" }};}
  </component> -->
</template>

<style>
article {
  scroll-behavior: smooth;
  white-space: break-spaces;
  word-spacing: unset;
  word-wrap: break-word;
  word-break: break-all;
  /* text-align: justify; */
  font-size: 25px;
  line-height: 1.5em;
  /* font-family: Consolas; */
  /* width: 22em; */
  background: #fff;
  color: black;
}

/* article::highlight(clickSelection) {
  background: #aaa;
}
article::highlight(jumpTargetRange) {
  background: #000;
  color: #fff;
}
article::highlight(justOne) {
  color: #666;
  text-decoration-line: line-through;
  text-decoration-thickness: 1px;
  text-decoration-style: wavy;
  text-decoration-color: red;
} */

/* article {
  color: #000;
  background: #fff;
}
article::highlight(all) {
  color: red;
}
article::highlight(hover) {
  color: #fff;
  background: red;
}
article::highlight(clickSelection) {
  color: #111;
  background: #ccc;
}
article::highlight(jumpTargetRange) {
  color: #fff;
  background: #000;
}
article::highlight(justOne) {
  color: #aaa;
} */
</style>
