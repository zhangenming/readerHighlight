<!-- 应用逻辑 vue逻辑分离 -->
<script setup lang="ts">
import { useLocalStorage } from "@vueuse/core"

import { ref, computed, watchEffect, onMounted, watch } from "vue"
import txt from "../txt/生死疲劳.txt?raw"

type MyRange = Range & {
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

const selection = getSelection()
const dom = ref<Node>()
const newSearchCache: { [s: string]: MyRange[] } = {}

// scroll...
const scrollTop = useLocalStorage<number>("scrollTop", null)
onMounted(() => {
  globalThis.scrollTo({ top: scrollTop.value, behavior: "smooth" })
})
document.onscroll = () => {
  scrollTop.value = globalThis.scrollY
}

// vue reactivity...
const allTerms = useLocalStorage("allTerms", new Set<string>())

const allRanges = computed(() => {
  return [...allTerms.value].flatMap(addNewSlection)
})

// // 谁影响: scrollTop allRanges
// // 影响谁:
// const allRangesOnScreen = computed(() => {
//   const s = scrollTop.value
//   const x = s + globalThis.innerHeight
//   return allRanges.value.filter(({ y }) => y >= s && y <= x) // todo使用二分算法减少运算量
// })

// const allRangesOnScreenFlag = computed(() => {
//   return allRangesOnScreen.value.map((e) => e.startOffset).join("-")
// })

// onMounted(() => {
//   watch(allRangesOnScreenFlag, () => {
//     setHighlightColor("all", allRangesOnScreen.value.xx, 1) // todo分离渲染
//   })
// })
onMounted(() => {
  setHighlightColor("all", allRanges.value, 1) // todo分离渲染

  watch(allRanges, () => {
    setHighlightColor("all", allRanges.value, 1) // todo分离渲染
  })
})

const jumpTargetRange = ref<MyRange>()
watch(jumpTargetRange, (res) => {
  res && setHighlightColor("jumpTargetRange", [res], 9)
})

// event...
document.onmousemove = watchChange(
  (hover: any) => {
    setHighlightColor(
      "hover",
      allRanges.value.filter((e) => e.query === hover),
      4
    )
  },
  (evt: any) => getClickedRange(evt)?.query
)

let clientY = 0
document.onclick = (e) => {
  const query = selection + ""
  selection?.empty()

  if (query) {
    if (query === "" || query.includes("\n")) return

    if (allTerms.value.has(query)) {
      return allTerms.value.delete(query)
    }

    allTerms.value.add(query)

    document.title = addNewSlection(query).length + ""
    return
  }

  clientY = e.clientY
  const r = getClickedRange(e)

  if (!r) return

  jumpRange(r, e)

  setHighlightColor(
    "clickSelection",
    allRanges.value.filter((e) => e.query === r.query),
    3
  )
}

document.onkeydown = (e) => {
  if (e.altKey) {
    e.preventDefault()
    jumpRange(jumpTargetRange.value!, e)
  }
}

function watchChange(fn: any, getArg?: any) {
  let lastArg: any

  return function (arg: any) {
    const argDone = getArg?.(arg) || arg
    if (lastArg != argDone) {
      lastArg = argDone
      fn(argDone)
    }
  }
}

function addNewSlection(query: string) {
  return (newSearchCache[query] =
    newSearchCache[query] ||
    getPositions(txt, query)
      .map((pos) => createRange(pos, query))
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
      }))
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

function getClickedRange({ pageX, pageY }: { pageX: number; pageY: number }) {
  return allRanges.value.find(({ x, y, width, height }) => {
    const xMatch = x <= pageX && pageX <= x + width
    const yMatch = y <= pageY && pageY <= y + height
    return xMatch && yMatch
  })
}

const styleHighlightCache: { [s: string]: string } = {}
function setHighlightColor(key: string, h: MyRange[], priority?: number) {
  const flag = h.map((e) => e.startOffset).join("-")
  if (styleHighlightCache[key] === flag) return
  styleHighlightCache[key] = flag

  const H = new (globalThis as any).Highlight(...h)
  H.priority = priority
  ;(CSS as any).highlights.set(key, H)
}

function createRange(start: number, query: string) {
  const range = new Range() as MyRange
  const d = dom.value!.childNodes[0]
  range.setStart(d, start)
  range.setEnd(d, start + query.length)
  return range
}

function getPositions(txt: string, query: string) {
  const targets = []
  let index = txt.indexOf(query)
  while (index !== -1) {
    targets.push(index)
    index = txt.indexOf(query, index + 1)
  }
  return targets
}
</script>

<template>
  <article ref="dom">
    {{ txt }}
  </article>
</template>

<style scoped>
article {
  scroll-behavior: smooth;
  white-space: break-spaces;
  word-spacing: unset;
  word-wrap: break-word;
  word-break: break-all;
  /* text-align: justify; */
  /* line-height: 1em; */
  font-size: 20px;
  /* font-family: Consolas; */
  /* width: 22em; */
  background: #fff;
  color: #fff;
}

article::highlight(all) {
  color: #666;
}
/* article::highlight(hover) {
  color: aliceblue;
  background: cornflowerblue;
} */
article::highlight(clickSelection) {
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
}

article {
  color: #ddd;
  background: #666;
}
article::highlight(all) {
  color: #000;
}
/* article::highlight(hover) {
  color: #aaa;
  background: #fff;
} */
article::highlight(clickSelection) {
  color: #111;
  background: #ccc;
}
article::highlight(jumpTargetRange) {
  color: #0f0;
  background: #fff;
}
article::highlight(justOne) {
  color: #aaa;
}
</style>
