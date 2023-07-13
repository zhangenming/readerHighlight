<script setup lang="ts">
import { ref, watch, watchEffect } from "vue"
import txt from "../txt/天道.txt?raw"
import { computed } from "vue"

type MyRange = Range & {
  x: number
  y: number
  width: number
  height: number

  firstY: number
  lastY: number
  nextY: number
  preY: number
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
const clickRange = ref<MyRange>()

const allRangesObj = ref<{ [s: string]: MyRange[] }>({})

const allRangesObjFlat = computed(() =>
  Object.values(allRangesObj.value).flat()
)
const allRangesObjFlatOnScreen = computed(() => {
  const s = scrollTop.value
  const x = s + window.innerHeight
  const f = allRangesObjFlat.value.filter(({ y }) => y > s && y < x)
  return f
})

const allRangesObjFlatOnScreenHover = computed(() =>
  allRangesObjFlatOnScreen.value.filter((e) => e.query === hoverSelection.value)
)

watch(allRangesObjFlatOnScreen, (allRangesObjFlatOnScreen) => {
  HighlightWrap("fixed", allRangesObjFlatOnScreen)
})

watch(allRangesObjFlatOnScreenHover, (allRangesObjFlatOnScreenHover) => {
  HighlightWrap("hover", allRangesObjFlatOnScreenHover)
})

watchEffect(() => {
  HighlightWrap(
    "click",
    allRangesObjFlatOnScreen.value.filter(
      (e) => e.query === clickSelection.value
    )
  )
})

const selectedAllTerms = ref(new Set<string>())

setTimeout(() => {
  dom = document.querySelector("article")!.childNodes[0]

  newSearch("丁元英")
  newSearch("小丹")
  newSearch("遥远")
  newSearch("的")

  document.onscroll = () => {
    scrollTop.value = document.documentElement.scrollTop
  }

  document.onmousemove = (e) => {
    const r = XY2Range(e)
    if (!r) return

    hoverSelection.value = r.query
  }

  document.onclick = ({ x, y, ctrlKey, shiftKey }) => {
    const s = selection + ""
    selection?.empty()

    if (s) {
      return selectedAllTerms.value.has(s) ? deleteItem(s) : newSearch(s)
    }

    const r = XY2Range({ x, y })
    if (!r) return

    goR(r, ctrlKey, shiftKey)
  }

  document.onkeydown = (e) => {
    if (e.code === "Space") {
      e.preventDefault()
      goR(
        e.shiftKey ? clickRange.value?.preR! : clickRange.value?.nextR!,
        e.ctrlKey,
        e.shiftKey
      )
    }
  }
})

function goR(r: MyRange, ctrlKey: boolean, shiftKey: boolean) {
  clickSelection.value = r.query
  clickRange.value = r

  scrollBy({
    behavior: "smooth",
    top:
      (ctrlKey
        ? r[shiftKey ? "firstY" : "lastY"]
        : r[shiftKey ? "preY" : "nextY"]) - r.y,
  })
}

function deleteItem(query: string) {
  selectedAllTerms.value.delete(query)

  delete allRangesObj.value[query]
}
function newSearch(query: string) {
  if (query === "" || query.includes("\n")) return

  selectedAllTerms.value.add(query)

  const ranges = searchTxt(txt, query).map((pos) => {
    const range = createRange(pos, query)

    let { x, y, width, height } = range.getBoundingClientRect() // todo 只计算当前屏幕需要的dom, 这个信息是为了click的时候XY2Range用, 现在暂时用不到
    y += document.documentElement.scrollTop

    Object.assign(range, {
      x,
      y,
      width,
      height,
      query,
    })

    return range
  })

  ranges.forEach((range, idx, ranges) => {
    const firstR = ranges[0]
    const lastR = ranges[ranges.length - 1]
    const preR = ranges[idx - 1] || lastR
    const nextR = ranges[idx + 1] || firstR

    range.firstY = firstR.y
    range.lastY = lastR.y
    range.preY = preR.y
    range.nextY = nextR.y

    range.preR = preR
    range.nextR = nextR
  })

  allRangesObj.value[query] = ranges
}
function XY2Range({ x, y }: { x: number; y: number }) {
  y += document.documentElement.scrollTop
  return allRangesObjFlat.value.find((range) => {
    const xMatch = range.x <= x && x <= range.x + range.width
    const yMatch = range.y <= y && y <= range.y + range.height
    return xMatch && yMatch
  })
}

function HighlightWrap(key: string, h?: MyRange[]) {
  const highlights = (CSS as any).highlights

  if (h) {
    highlights.set(key, new (window as any).Highlight(...h))
  } else {
    return highlights.get(key)
  }
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
  <article id="reader">
    {{ txt }}
  </article>

  <component is="style">
    article__::highlight({{ hoverSelection }}) { color: red; }
  </component>
</template>

<style scoped>
* {
  scroll-behavior: smooth;
}

article {
  color: #aaa;
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

article#reader::highlight(click) {
  background: #aea;
  color: rgb(37, 11, 237);
}
article::highlight(fixed) {
  color: v-bind(hoverSelection);
  color: #000;
}
article::highlight(hover) {
  color: red;
}
</style>
