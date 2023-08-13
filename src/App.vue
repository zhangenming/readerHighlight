<!-- 应用逻辑 vue逻辑分离 -->
<script setup lang="ts">
import { useLocalStorage } from "@vueuse/core"
import { ref, computed, onMounted, watch, nextTick, reactive } from "vue"
import { MyRange, getPositions } from "./utils"
import {
  allRanges,
  getScreenPointRange,
  getScreenPointRangeIdx,
  setAllranges,
  setHighlights,
} from "./core"

import _txt from "../txt/天之下2.txt?raw"

const len = new URL(globalThis.location + "").searchParams.get("len")
let txt = _txt
txt = len ? _txt.slice(0, 1e5 * Number(len)) : _txt

const selection = getSelection()
const dom = ref<Node>()

// vue reactivity...
const allWord = useLocalStorage("allWord", new Set<string>())
onMounted(() => {
  allWord.value.forEach((word) => setHighlights(word, txt, dom.value!))
})

const hoverWord = ref()

const jumpTargetRange = ref<MyRange>()

// event
let clientYLocal = 0
let 跳转之前的位置: number
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
    setHighlights(query, txt, dom.value!)

    const len = getPositions(txt, query).length
    if (len === 1) {
      setTimeout(() => del(query), 200)
    }

    document.title = len + ""
    return

    function del(query: string) {
      allWord.value.delete(query)
      ;(CSS as any).highlights.set(query, new (globalThis as any).Highlight())
      setAllranges(allRanges.filter((e) => e.query != query))
    }
  }

  clientYLocal = e.clientY
  const r = getScreenPointRange(e)

  if (!r) return

  跳转之前的位置 = globalThis.scrollY
  jumpRange(r, e)
}

// 文本量多少 渲染量多少(本word/全word) 是否第一次
//  1   2   4   8
//  50  200 800 1600
//  16  50  200

let autoScrollSpeed = 0
let _word: string | undefined

const info = ref({ current: 0, all: 0, x: 0, y: 0 })
const 鼠标位置绝对值 = "y"
document.onmousemove = (evt) => {
  // 设置滚动速度
  autoScrollSpeed =
    evt.clientY / globalThis.innerHeight > 0.99
      ? evt.clientX / globalThis.innerWidth
      : 0

  // 设置hover
  const range = getScreenPointRange(evt)
  const word = range?.query

  // 设置hover idx
  info.value = {
    all: getPositions(txt, word).length,
    current: getScreenPointRangeIdx(word, range),
    x: evt.x,
    y: evt[鼠标位置绝对值],
  }

  if (_word === word) return
  _word = word

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

  if (e.key === "Backspace") {
    globalThis.scrollTo({
      behavior: "smooth",
      top: 跳转之前的位置,
    })
  }
}

setInterval(() => {
  autoScrollSpeed && window.scrollBy(0, 0.1 * autoScrollSpeed)
  // globalThis.scrollY.xx
}, 1)

// scroll...
const scrollTop = useLocalStorage<number>("scrollTop", null)
onMounted(() => {
  globalThis.scrollTo({ top: scrollTop.value, behavior: "smooth" })
})
document.onscroll = () => {
  scrollTop.value = globalThis.scrollY
}

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
    top: jumpTargetRange.value.y - clientYLocal, // + (scrollY % 26),
  })
}

const boss = false
const z = boss ? `{color: #eee;}` : `{ color: red; }`
const x = boss ? `{color: #eee;}` : `{ color: #fff;background: red; }`
</script>

<template>
  <div>
    <article ref="dom">
      {{ txt }}
    </article>
  </div>

  <div
    v-show="info.current"
    :style="`
      top: ${info.y + 10}px;
      left: ${info.x + 10}px;
      position: fixed;
      padding: 5px;
      border: 2px solid darkred;
      background: cornflowerblue;
      color: white;
      font-weight: 900;
      border-radius: 10px;
    `"
  >
    {{ info.current }} / {{ info.all }}
  </div>

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
