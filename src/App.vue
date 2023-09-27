<!-- 应用逻辑 vue逻辑分离 -->
<!-- 刷新的时候 页面会滚动一小短距离 -->
<script setup lang="ts">
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
import { useLocalStorage } from "@vueuse/core"
import {
  MyRange,
  getPositions,
  getScrollPosition,
  setScrollPosition,
} from "./utils"
import {
  getRangeFromPoint,
  getRangeFromPointIdx,
  setHighlights,
  geneNewQueryRange,
} from "./core"
import { jumpRange } from "./reader"
import Time from "./components/Time.vue"

import storeFile from "./store/store"
const store = storeFile()

const { document } = window

// window.onload = function () {
//   history.scrollRestoration = "manual"
// }

const txt = "天道"
import(`../txt/${txt}.txt?raw`).then((res) => {
  const data = res.default.replaceAll("\n\n\n", "\n\n")

  store.text = data

  getPositions("(").map((idx) => [idx, data.indexOf(")", idx)])

  nextTick(() => {
    // getScrollPosition().xx
    // scrollYLocal.value.xx

    store.textDom = document.getElementById("dom")!.childNodes[0]

    setScrollPosition(scrollYLocal.value)

    setHighlights() // init set

    // getScrollPosition().xx
    // scrollYLocal.value.xx
  })
})

// vue reactivity... / / / / / / / / / / / / / / / / / / / / / / / / / / / / /

const jumpTargetRange = ref<MyRange>()

// mouseSCROLL event / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
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

  滚动速度.value < 1 && setHighlights()

  info.value = {} as any
}

// mouseCLICK event / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
let clientYLocal = 0
let 跳转之前的位置: number
document.onclick = (e) => {
  const query = getSelection() + ""
  getSelection()!.empty()

  if (query) {
    // range添加删除
    if (query === "" || query.includes("\n")) return

    if (store.allWord[query]) {
      del(query)
    } else {
      const v = geneNewQueryRange(query)

      store.allWord[query] = {
        show: true,
        v,
      }
    }

    if (store.allWord[query].show) {
      const len = getPositions(query).length
      document.title = len + ""

      if (len === 1) {
        setTimeout(() => {
          del(query)
        }, 400)
      }
    }

    function del(query: string) {
      store.allWord[query].show = !store.allWord[query].show
    }
  } else {
    // range跳转
    clientYLocal = e.clientY

    const target = getRangeFromPoint(e)
    if (!target) return

    跳转之前的位置 = getScrollPosition()
    jumpRange(target, e, jumpTargetRange, clientYLocal)
  }
}

// mouseMOVE event / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
const info = ref({ current: 0, all: 0, x: 0, y: 0 })
const hoverQuery = ref()
document.onmousemove = (() => {
  // let _word: string | undefined

  return (evt) => {
    if (Math.abs(evt.movementX) < 1) return // 可能是鼠标不小心偏移

    是否自动滚动 = false

    const target = getRangeFromPoint(evt) // hack for elementFromPoint
    if (!target) return

    const { query } = target
    hoverQuery.value = query

    // 设置hover idx
    info.value = {
      all: getPositions(query).length,
      current: 1, //getScreenPointRangeIdx(word, target),
      x: evt.x,
      y: evt.y, //鼠标位置绝对值
    }

    // if (_word === query) return
    // _word = query

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
    jumpRange(jumpTargetRange.value!, e, jumpTargetRange, clientYLocal)
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

const wordStyle = `{ color: #ccc;background: #fff; }`
const hoverWordStyle = `{ color: #fff;background: #ccc;}`
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
      {{ store.text }}
    </article>
    <Time />
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

  <component is="style" v-for="word of Object.keys(store.allWord)">
    <!-- {{
      word === hoverQuery
        ? `article::highlight(${word})${hoverWordStyle}`
        : `article::highlight(${word})${wordStyle}`
    }}

    article::highlight({{ word }})
    {{
      word === hoverQuery
        ? hoverWordStyle
        : wordStyle
    }} -->

    article::highlight({{ word }}){{ wordStyle }}
  </component>

  <component is="style">
    article::highlight({{ hoverQuery }}){{ hoverWordStyle }}
  </component>
  <!-- article::highlight({{ word }}):hover {{ hoverWordStyle }} -->
  <!-- 可惜不支持:hover和事件机制 需要使用JS模拟 -->
</template>

<style>
article {
  padding: 0 5px;
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

  color: #f6f6f6;
}
/* :root::target-text {
  color: red;
} */
</style>
