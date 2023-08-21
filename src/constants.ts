export const SCORE = (function(length = 19) {
  const arr = Array.from({length: length}, ()=> new Array(length).fill(0))
  const center = Math.floor(length / 2)
  for(let i = 0; i < length; i++) {
    for(let j = 0; j < length; j++) {
      arr[i][j] = length - Math.abs(i - center) - Math.abs(j - center)
    }  
  }
  return arr
})()