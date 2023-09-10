<!-- 应用逻辑 vue逻辑分离 -->
<script setup lang="ts">
import { useLocalStorage } from "@vueuse/core"
import { ref, computed, onMounted, watch, nextTick, reactive } from "vue"
import { MyRange, getPositions } from "./utils"
import {
  getScreenPointRange,
  getScreenPointRangeIdx,
  setHighlights,
} from "./core"
import { jumpRange } from "./reader"

import _txt from "../txt/四世同堂：足本：全三册 (老舍) (Z-Library).txt?raw"

const txt = _txt.replaceAll("\n\n\n", "\n\n")

const selection = getSelection()
const dom = ref<Node>()

// vue reactivity...
const allWord = useLocalStorage("allWord", new Set<string>())

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
    setColor()

    const len = getPositions(txt, query).length
    if (len === 1) {
      setTimeout(() => del(query), 200)
    }

    document.title = len + ""
    return

    function del(query: string) {
      allWord.value.delete(query)
      ;(CSS as any).highlights.set(query, new (globalThis as any).Highlight())
      // setAllranges(allRanges.filter((e) => e.query != query))
    }
  }

  clientYLocal = e.clientY
  const r = getScreenPointRange(e)

  if (!r) return

  跳转之前的位置 = globalThis.scrollY
  jumpRange(r, e, jumpTargetRange, clientYLocal)
}

// 文本量多少 渲染量多少(本word/全word) 是否第一次
//  1   2   4   8
//  50  200 800 1600
//  16  50  200

let _word: string | undefined

const info = ref({ current: 0, all: 0, x: 0, y: 0 })
const 鼠标位置绝对值 = "y"
document.onmousemove = (evt) => {
  // 关闭滚动
  openScroll = false

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

  // 设置hover
  hoverWord.value = word

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

// scroll...
setInterval(() => {
  openScroll &&
    globalThis.scrollBy({ top: speedScroll.value, behavior: "instant" })
})

const scrollY = useLocalStorage("scrollY", 0) // 当前滚动条位置
let scrollHeight: number // 滚动条完整高度
let openScroll = false
const speedScroll = useLocalStorage("speedScroll", 0.05)
document.onscroll = (e) => {
  scrollY.value = globalThis.scrollY

  info.value = {} as any

  setColor()
}
onMounted(() => {
  scrollHeight = document.body.scrollHeight
  globalThis.scrollTo({ top: scrollY.value, behavior: "smooth" })
})

function setColor() {
  allWord.value.forEach((query) =>
    setHighlights(query, txt, dom.value!, globalThis.scrollY)
  )
}

document.onkeydown = (e) => {
  const { key } = e

  if (key === "Alt") {
    e.preventDefault()
    jumpRange(jumpTargetRange.value!, e, jumpTargetRange, clientYLocal)
  }

  if (key === "Backspace") {
    Backspace("smooth")
  }

  // 开启/关闭
  if (key === "Enter") {
    // if (跳转之前的位置 && !openScroll) {
    //   Backspace("instant")
    // }
    openScroll = !openScroll
  }

  // 减速
  if (key === "ArrowLeft") {
    speedScroll.value *= 0.001
    setTimeout(() => {
      speedScroll.value *= 1000 * 0.9
    }, 1000 * 30)
  }

  // 加速
  if (key === "ArrowRight") {
    const S = 20
    speedScroll.value *= S
    setTimeout(() => {
      speedScroll.value *= 1.1 / S // 抵消上面的10, 最终是原来的110%
    }, 1000 * 1)
  }

  function Backspace(behavior: "smooth" | "instant") {
    globalThis.scrollTo({
      behavior,
      top: 跳转之前的位置,
    })
    跳转之前的位置 = 0
  }
}

const wordStyle = `{ color: red;background: #fff; }` // not work
const hoverWordStyle = `{ color: #fff;background: red;}`
</script>

<template>
  <div
    style="position: fixed; right: 0; background: cornflowerblue; color: white"
    v-if="0"
  >
    <!-- 进程 -->
    <div>{{ (scrollY / scrollHeight / 0.01).toFixed(2) }}</div>

    <!-- 速度 -->
    <div v-show="openScroll">{{ (speedScroll * 20).toFixed(2) }}</div>
  </div>

  <div>
    <article ref="dom">
      {{ txt }}
    </article>
  </div>

  <!-- <div
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
  </div> -->

  <component is="style" v-for="word of allWord">
    <!-- {{
      word === hoverWord
        ? `article::highlight(${word})${hoverWordStyle}`
        : `article::highlight(${word})${wordStyle}`
    }}

    article::highlight({{ word }})
    {{
      word === hoverWord
        ? hoverWordStyle
        : wordStyle
    }} -->

    article::highlight({{ word }}){{ wordStyle }}
  </component>

  <component is="style">
    article::highlight({{ hoverWord }}){{ hoverWordStyle }}
  </component>
  <!-- article::highlight({{ word }}):hover {{ hoverWordStyle }} -->
  <!-- 可惜不支持:hover和事件机制 需要使用JS模拟 -->
</template>

<style>
article {
  font-size: 30px;
  font-family: cursive;
  line-height: 1.5em;
  white-space: break-spaces;
  word-spacing: unset;
  word-wrap: break-word;
  word-break: break-all;
  /* text-align: justify; */
  /* font-family: Consolas; */
  /* width: 22em; */
  background: #fff;
  color: black;
  scroll-behavior: smooth;
}
</style>
