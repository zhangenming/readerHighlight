Object.defineProperties(Object.prototype,{
	xx: {
		get<T>(): T {
			console.log(this)
			return this as T
		}
	}
  })