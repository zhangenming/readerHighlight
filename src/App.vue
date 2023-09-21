<!-- 应用逻辑 vue逻辑分离 -->
<script setup lang="ts">
import { useLocalStorage } from "@vueuse/core"
import {
  ref,
  computed,
  onMounted,
  watch,
  nextTick,
  reactive,
  Ref,
  onUpdated,
} from "vue"
import {
  MyRange,
  getPositions,
  getScrollPosition,
  setScrollPosition,
  setTxt,
} from "./utils"
import {
  getScreenPointRange,
  getScreenPointRangeIdx,
  setQueryHighlights,
  geneNewQueryRange,
  AllWord,
} from "./core"
import { jumpRange } from "./reader"

const { document } = window

const txt = "天道"
const text = ref("init")

// window.onload = function () {
//   history.scrollRestoration = "manual"
// }

import(`../txt/${txt}.txt?raw`).then((res) => {
  const data = res.default.replaceAll("\n\n\n", "\n\n")

  setTxt((text.value = data)) // 更新 text

  nextTick(() => {
    // getScrollPosition().xx
    // scrollYLocal.value.xx

    setScrollPosition(scrollYLocal.value)
    ;(window as any).textDom = document.getElementById("dom")!.childNodes[0]

    // getScrollPosition().xx
    // scrollYLocal.value.xx
  })
})

// vue reactivity... / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
const allWord = useLocalStorage("allWord", {} as AllWord)

const jumpTargetRange = ref<MyRange>()

// mousescroll event / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
let 是否自动滚动 = false
const 滚动速度 = useLocalStorage("speedScroll", 0.05)
requestAnimationFrame(function runScroll() {
  requestAnimationFrame(runScroll)

  是否自动滚动 && setScrollPosition(getScrollPosition() + 滚动速度.value)
})

//
// 奇怪  正常情况下速度也会一直变化
// 开发工具, 生产环境, 鼠标移入界面 都会对滚动性能产生影响
// 计算真实滚动速度
const 计算出的真实滚动速度 = ref(0)
;(() => {
  let tmpPosition = getScrollPosition()
  setInterval(() => {
    计算出的真实滚动速度.value = getScrollPosition() - tmpPosition
    tmpPosition = getScrollPosition()
  }, 100)
})()

//
const scrollYLocal = useLocalStorage("scrollYLocal", 0) // 当前滚动条位置
document.onscroll = () => {
  // getScrollPosition().xx
  // "onscroll".xx

  scrollYLocal.value = getScrollPosition()

  滚动速度.value < 1 &&
    Object.keys(allWord.value).forEach((query) =>
      setQueryHighlights(query, allWord)
    )

  info.value = {} as any
}

// mouseclick event / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
let clientYLocal = 0
let 跳转之前的位置: number
document.onclick = (e) => {
  const query = getSelection() + ""
  getSelection()!.empty()

  if (query) {
    // range添加删除
    if (query === "" || query.includes("\n")) return

    if (allWord.value[query]) {
      del(query)
    } else {
      allWord.value[query] = {
        show: true,
        v: geneNewQueryRange(query),
      }

      setQueryHighlights(query, allWord)
    }

    if (allWord.value[query].show) {
      const len = getPositions(query).length
      document.title = len + ""

      if (len === 1) {
        setTimeout(() => {
          del(query)
        }, 400)
      }
    }

    function del(query: string) {
      allWord.value[query].show = !allWord.value[query].show
      setQueryHighlights(query, allWord)
    }
  } else {
    // range跳转
    clientYLocal = e.clientY
    const target = getScreenPointRange(e, allWord.value)

    if (!target) return

    跳转之前的位置 = getScrollPosition()
    jumpRange(target, e, jumpTargetRange, clientYLocal, allWord.value)
  }
}

// mousemove event / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
const info = ref({ current: 0, all: 0, x: 0, y: 0 })
const hoverWord = ref()
document.onmousemove = (() => {
  let _word: string | undefined

  return (evt) => {
    是否自动滚动 = false

    const range = getScreenPointRange(evt, allWord.value) // hack for elementFromPoint
    const word = range?.query

    // 设置hover idx
    info.value = {
      all: getPositions(word).length,
      current: 1, //getScreenPointRangeIdx(word, range),
      x: evt.x,
      y: evt.y, //鼠标位置绝对值
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
})()

// key event / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
document.onkeydown = (e) => {
  const { key } = e

  if (key === "Alt") {
    e.preventDefault()
    jumpRange(
      jumpTargetRange.value!,
      e,
      jumpTargetRange,
      clientYLocal,
      allWord.value
    )
  }

  if (key === "Backspace") {
    Backspace("smooth")
  }

  if (key === "Enter") {
    // if (跳转之前的位置 && !openAutoScroll) {
    //   Backspace("instant")
    // }
    是否自动滚动 = true
  }

  // 减速
  if (key === "ArrowLeft") {
    滚动速度.value *= 0.8
    // speedScroll.value *= 0.001
    // setTimeout(() => {
    //   speedScroll.value *= 1000 * 0.9
    // }, 1000 * 30)
  }

  // 加速
  if (key === "ArrowRight") {
    滚动速度.value *= 1.2
    // const S = 20
    // speedScroll.value *= S
    // setTimeout(() => {
    //   speedScroll.value *= 1.1 / S // 抵消上面的10, 最终是原来的110%
    // }, 1000 * 2)
  }

  function Backspace(behavior: "smooth" | "instant") {
    setScrollPosition(跳转之前的位置, behavior)

    跳转之前的位置 = 0
  }
}

const wordStyle = `{ color: red;background: #fff; }`
const hoverWordStyle = `{ color: #fff;background: red;}`
</script>

<template>
  <div
    style="position: fixed; right: 0; background: cornflowerblue; color: white"
  >
    <!-- 进程 -->
    <div>
      {{ (scrollYLocal / document.body.scrollHeight / 0.01).toFixed(2) }} %
    </div>

    <!-- 速度 -->
    <div v-show="是否自动滚动">{{ (滚动速度 * 20).toFixed(2) }} px/s</div>
    <div>{{ 计算出的真实滚动速度.toFixed(3) }}</div>
  </div>

  <div>
    <article id="dom">
      {{ text }}
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

  <component is="style" v-for="word of Object.keys(allWord)">
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
  /* user-select: none; */

  /* color: #eee; */
}
/* :root::target-text {
  color: red;
} */
</style>
