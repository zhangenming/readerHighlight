import { ComputedRef, computed, nextTick, ref, watch } from "vue"
import { useLocalStorage } from "@vueuse/core"
import { defineStore } from "pinia"
import { MyRange, getPositions } from "../utils"
import { createRange } from "../core"

export default defineStore("store", () => {
  const text = ref("init")
  const textDom = ref<Node>()

  // const spking = computed(() => {
  //   const t = text.value
  //   return getPositions("(").map((idx) => [idx, t.indexOf(")", idx)])
  // }) as ComputedRef<number[][]>

  const allWord = useLocalStorage(
    "allWord",
    {} as { [key: string]: { show: boolean; v: MyRange[] } }
  )

  import("../core").then(({ setHighlights, setHighlights2 }) => {
    watch(allWord, () => setHighlights())

    watch(textDom, () => {
      const t = text.value

      const spking = getPositions("“").map((start) => ({
        start: 1 + start,
        end: t.indexOf("”", start),
      }))

      setHighlights2("spking", spking)
    })
  })

  return { text, textDom, allWord }
})()
// s u c r
