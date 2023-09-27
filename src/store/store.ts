import { ref, watch } from "vue"
import { useLocalStorage } from "@vueuse/core"
import { defineStore } from "pinia"
import { MyRange } from "../utils"

export default defineStore("store", () => {
  const text = ref("init")
  const textDom = ref<Node>()

  const allWord = useLocalStorage(
    "allWord",
    {} as { [key: string]: { show: boolean; v: MyRange[] } }
  )

  import("../core").then(({ setHighlights }) => {
    watch(allWord, () => setHighlights())
  })

  return { text, textDom, allWord }
})()
// s u c r
