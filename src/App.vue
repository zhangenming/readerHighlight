<!-- 应用逻辑 vue逻辑分离 -->
<script setup lang="ts">
import { ref, computed, watchEffect } from "vue"
import txt from "../txt/生死疲劳.txt?raw"

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

const allRangesObj = ref<{ [s: string]: MyRange[] }>({})

const allRangesObjFlat = computed(() =>
  Object.values(allRangesObj.value).flat()
)
const allRangesObjFlatOnScreen = computed(() => {
  const s = scrollTop.value
  const x = s + window.innerHeight
  return allRangesObjFlat.value.filter(({ y }) => y >= s && y <= x)
})

watchEffect(() => {
  HighlightWrap("all", allRangesObjFlatOnScreen.value, 1)
})

let oldHover: string | undefined
document.onmousemove = (evt) => {
  const hover = getClickedRange(evt)?.query
  if (oldHover === hover) return

  oldHover = hover

  HighlightWrap(
    "hover",
    allRangesObjFlatOnScreen.value.filter((e) => e.query === hover),
    4
  )
}
document.onmousemove = watchChange(
  (hover: any) => {
    HighlightWrap(
      "hover",
      allRangesObjFlatOnScreen.value.filter((e) => e.query === hover),
      4
    )
  },
  (evt: any) => getClickedRange(evt)?.query
)

function watchChange(fn: any, getArg?: any) {
  let lastArgs: any

  return function (arg: any) {
    const a = getArg ? getArg(arg) : arg
    if (lastArgs != a) {
      lastArgs = a
      fn(a)
    }
  }
}

const clickRange = ref<MyRange>()
watchEffect(() => {
  clickRange.value && HighlightWrap("clickRange", [clickRange.value], 9)
})

const selectedAllTerms = ref(new Set<string>())

setTimeout(() => {
  dom = document.querySelector("article")!.childNodes[0]

  newSearch("叙述")
  newSearch("改革")
  newSearch("中国")

  document.onclick = (e) => {
    const s = selection + ""
    selection?.empty()

    if (s) {
      return selectedAllTerms.value.has(s) ? deleteItem(s) : newSearch(s)
    }

    jumpPos(getClickedRange(e), e)
  }

  document.onkeydown = (e) => {
    if (e.altKey) {
      e.preventDefault()
      jumpPos(clickRange.value, e)
    }
  }

  document.onscroll = () => {
    scrollTop.value = window.scrollY
  }
})

function newSearch(query: string) {
  if (query === "" || query.includes("\n")) return

  selectedAllTerms.value.add(query)

  const ranges = getPositions(txt, query)
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
        y: y + window.scrollY, // 相对0的绝对距离
        width,
        height,
      })
    })

  if (ranges.length === 1) {
    HighlightWrap("justOne", ranges, 19)

    // setTimeout(() => {
    //   justOne.value = undefined
    // }, 3000)
  } else {
    allRangesObj.value[query] = ranges
  }
}

const clickSelection = watchChange((query: string) => {
  HighlightWrap(
    "clickSelection",
    allRangesObjFlatOnScreen.value.filter((e) => e.query === query),
    3
  )
})

let oldQuery = ""
let pos = scrollY
function jumpPos(
  currentR: MyRange | undefined,
  { ctrlKey, shiftKey, clientY }: KeyboardEvent | MouseEvent
) {
  if (!currentR) return

  const type = ctrlKey
    ? shiftKey
      ? "firstR"
      : "lastR"
    : shiftKey
    ? "preR"
    : "nextR"

  const { query, [type]: nextR } = currentR

  // clickSelection(query)
  oldQuery != query &&
    HighlightWrap(
      "clickSelection",
      allRangesObjFlatOnScreen.value.filter((e) => e.query === query),
      3
    )
  oldQuery = query

  clickRange.value = nextR

  // scrollTo({
  //   top: pos,
  // })
  // const top = nextR.y - currentR.y
  // pos = top + scrollY
  // scrollBy({
  //   behavior: "smooth",
  //   top,
  // })

  scrollTo({
    behavior: "smooth",
    // top: nextR.y - y + 26 - (scrollY % 26),
    top: nextR.y - clientY,
  })
}

function deleteItem(query: string) {
  selectedAllTerms.value.delete(query)

  delete allRangesObj.value[query]
}

function getClickedRange({ pageX, pageY }: { pageX: number; pageY: number }) {
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
  <article>
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
article::highlight(hover) {
  color: aliceblue;
  background: cornflowerblue;
}
article::highlight(clickSelection) {
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
