import { Ref } from "vue"
import { MyRange, setScrollPosition } from "./utils"
import { withFourJumpInfo } from "./core"

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

  jumpTargetRange.value = withFourJumpInfo(currentR[type])

  setScrollPosition(jumpTargetRange.value.y - clientYLocal, "smooth")
}
