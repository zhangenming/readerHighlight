import "./debug.js"
import "./style.css"
import { createApp } from "vue"
import { createPinia } from "pinia"
import AppWrap from "./AppWrap.vue"

createApp(AppWrap).use(createPinia()).mount("#app")
