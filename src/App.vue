<script setup lang="ts">
import { ref, computed, watchEffect } from "vue"
import txt from "../txt/天道.txt?raw"

type MyRange = Range & {
  x: number
  y: number
  width: number
  height: number

  // firstY: number
  // lastY: number
  // nextY: number
  // preY: number

  firstR: MyRange
  lastR: MyRange
  nextR: MyRange
  preR: MyRange

  query: string
}

const selection = getSelection()
let dom: Node

const scrollTop = ref(0)

const hoverSelection = ref("")
const clickSelection = ref("")

const allRangesObj = ref<{ [s: string]: MyRange[] }>({})

const allRangesObjFlat = computed(() =>
  Object.values(allRangesObj.value).flat()
)
const allRangesObjFlatOnScreen = computed(() => {
  const s = scrollTop.value
  const x = s + window.innerHeight
  return allRangesObjFlat.value.filter(({ y }) => y > s && y < x)
})

watchEffect(() => {
  HighlightWrap("all", allRangesObjFlatOnScreen.value, 1)
})

watchEffect(() => {
  HighlightWrap(
    "hover",
    allRangesObjFlatOnScreen.value.filter(
      (e) => e.query === hoverSelection.value
    ),
    4
  )
})

watchEffect(() => {
  HighlightWrap(
    "click",
    allRangesObjFlatOnScreen.value.filter(
      (e) => e.query === clickSelection.value
    ),
    3
  )
})

const clickRange = ref<MyRange>()
watchEffect(() => {
  clickRange.value && HighlightWrap("clickRange", [clickRange.value.nextR], 9)
})

const justOne = ref<MyRange>()
watchEffect(() => {
  justOne.value && HighlightWrap("justOne", [justOne.value], 19)
})

const selectedAllTerms = ref(new Set<string>())

setTimeout(() => {
  dom = document.querySelector("article")!.childNodes[0]

  newSearch("(第一部分)")
  newSearch("丁元英")
  newSearch("小丹")
  newSearch("遥远")

  document.onclick = (e) => {
    const s = selection + ""
    selection?.empty()

    if (s) {
      return selectedAllTerms.value.has(s) ? deleteItem(s) : newSearch(s)
    }

    const r = XY2Range(e)
    if (!r) return

    goR(r, e.ctrlKey, e.shiftKey)
  }

  document.onscroll = () => {
    scrollTop.value = document.documentElement.scrollTop
  }

  document.onmousemove = (e) => {
    const r = XY2Range(e)
    if (!r) return

    hoverSelection.value = r.query
  }

  document.onkeydown = (e) => {
    if (e.altKey) {
      e.preventDefault()
      goR(
        e.shiftKey ? clickRange.value?.preR! : clickRange.value?.nextR!,
        e.ctrlKey,
        e.shiftKey
      )
    }
  }
})

function newSearch(query: string) {
  if (query === "" || query.includes("\n")) return

  selectedAllTerms.value.add(query)

  const ranges = searchTxt(txt, query)
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
        y: y + document.documentElement.scrollTop, // 相对0的绝对距离
        width,
        height,
      })
    })

  if (ranges.length === 1) {
    justOne.value = ranges[0]
    // setTimeout(() => {
    //   justOne.value = undefined
    // }, 3000)
  } else {
    allRangesObj.value[query] = ranges
  }
}

function goR(r: MyRange, ctrlKey: boolean, shiftKey: boolean) {
  clickSelection.value = r.query
  clickRange.value = r

  scrollBy({
    behavior: "smooth",
    top:
      (ctrlKey
        ? r[shiftKey ? "firstR" : "lastR"]
        : r[shiftKey ? "preR" : "nextR"]
      ).y - r.y,
  })
}

function deleteItem(query: string) {
  selectedAllTerms.value.delete(query)

  delete allRangesObj.value[query]
}

function XY2Range({ pageX, pageY }: { pageX: number; pageY: number }) {
  return allRangesObjFlat.value.find(({ x, y, width, height }) => {
    const xMatch = x <= pageX && pageX <= x + width
    const yMatch = y <= pageY && pageY <= y + height
    return xMatch && yMatch
  })
}

function HighlightWrap(key: string, h: MyRange[], priority?: number) {
  const H = new (window as any).Highlight(...h)
  H.priority = priority
  ;(CSS as any).highlights.set(key, H)
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
  scroll-behavior: smooth;
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

article::highlight(all) {
  color: #666;
}
article::highlight(hover) {
  color: aliceblue;
  background: cornflowerblue;
}
article::highlight(click) {
  background: #aaa;
}
article::highlight(clickRange) {
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
</style>
