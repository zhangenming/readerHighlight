import { Ref } from "vue"
import { MyRange } from "./utils"

export function jumpRange(
  currentR: MyRange,
  { ctrlKey, shiftKey }: KeyboardEvent | MouseEvent,
  jumpTargetRange: Ref<MyRange | undefined>,
  clientYLocal: number
) {
  const type = ctrlKey
    ? shiftKey
      ? "firstR"
      : "lastR"
    : shiftKey
    ? "preR"
    : "nextR"

  jumpTargetRange.value = currentR[type]

  globalThis.scrollTo({
    behavior: "smooth",
    top: jumpTargetRange.value.y - clientYLocal, // + (scrollY % 26),
  })
}
