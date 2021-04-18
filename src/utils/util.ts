
// RegExp's a string and tests it against another string
export const regexTest = (source: any, regex: any) => {
  return new RegExp(regex).test(source)
}

// iterates array's & object props and uses supplied (regex) string to test the values
export const deepRegexTest = (source: any, regex: any) => {
  // console.log(typeof source, { source, regex })
  switch (typeof source) {
    case 'string':
      return regexTest(source, regex)

    case 'object':
      if (source instanceof Array) {
        for (let i = 0; i < source.length; i++) {
          if (deepRegexTest(source[i], regex)) {
            return true
          }
        }
        return false
      }

      let objKeys = Object.keys(source)
      for (let i = 0; i < objKeys.length; i++) {
        let currentKey = objKeys[i]
        if (source.hasOwnProperty(objKeys[i])) {
          let currentVal = source[currentKey]
          if (deepRegexTest(currentVal, regex)) {
            return true
          }
        }
      }

      return false

    default:
      return false
  }
}
