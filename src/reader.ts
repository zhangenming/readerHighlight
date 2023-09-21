import { Ref } from "vue"
import { MyRange, setScrollPosition } from "./utils"
import { AllWord, withRelation } from "./core"

export function jumpRange(
  currentR: MyRange,
  { ctrlKey, shiftKey }: KeyboardEvent | MouseEvent,
  jumpTargetRange: Ref<MyRange | undefined>,
  clientYLocal: number,
  allWordValue: AllWord
) {
  const type = ctrlKey
    ? shiftKey
      ? "firstR"
      : "lastR"
    : shiftKey
    ? "preR"
    : "nextR"

  jumpTargetRange.value = withRelation(currentR[type], allWordValue)

  setScrollPosition(jumpTargetRange.value.y - clientYLocal, "smooth")
}
