<script setup lang="ts">
  import { ref, onMounted, watchEffect, reactive} from 'vue'
  import * as _ from 'lodash'
  import {SCORE} from '../constants'

  const canvas = ref<HTMLCanvasElement>()
  let context = ref<CanvasRenderingContext2D>()
  const SIZE = 500 // 棋盘大小
  const PADDING = 10 // 棋盘边框
  const ROWS = 19 // 行
  const COLS = 19 // 列
  const BOXSIZE = (SIZE - 2 * PADDING) / (ROWS - 1) // 每个单元格的大小
  // const DEFAULT_ARR = Array(ROWS).fill(Array(ROWS).fill(0)) // fill 填充的是整个对象的引用
  const DEFAULT_ARR = Array.from({length: ROWS}, ()=> new Array(COLS).fill(0));
  const state = reactive<{
    status: 'ready' | 'running' | 'end';
    arr: Array<Array<number>>;
    mouse: [number, number];
    isBlack: boolean;
    history: Array<{x:number, y: number}>
    isRobot: boolean;
  }>({
    status: 'ready',
    arr: DEFAULT_ARR, // 棋盘数据
    mouse: [-1, -1], // 鼠标移动棋子位置
    isBlack: true,
    history: [],
    isRobot: false
  })

  const start  = () => {
    state.status = 'running'
  }
  const startRobot  = () => {
    state.isRobot = true
    state.status = 'running'
  }
  const restart  = () => {
    state.status = 'ready'
    state.arr = Array.from({length: ROWS}, ()=> new Array(COLS).fill(0));
    state.history = []
    state.isBlack = true
    state.mouse = [-1, -1]
    const ctx = context.value as CanvasRenderingContext2D
    if (ctx) {
      ctx.clearRect(0, 0, SIZE, SIZE)
      init()
    }
  }

  const checkCount = (x:number, y:number, target: number) => {
    // 检查行胜利
    let countRow = 1 
    let offsetRow = -1 
    while(countRow < 5) {
      if (x + offsetRow >= 0 && x + offsetRow <= ROWS - 1 && state.arr[x + offsetRow][y] === target) {
        countRow += 1
        if (countRow >= 5) {
          break
        }
        if (offsetRow < 0) {
          offsetRow -= 1
        } else {
          offsetRow += 1
        }
      } else if (offsetRow < 0) {
        offsetRow = 1
      } else {
        break
      }
    }
    // 检查列胜利
    let countCol = 1 // 累计数
    let offsetCol = -1 // 偏移量(命名风格统一)
    while(countCol < 5) {
      if (y + offsetCol >= 0 && y + offsetCol <= ROWS -1 && state.arr[x][y + offsetCol] === target) {
        countCol += 1
        if (countCol >= 5) {
          break
        }
        if (offsetCol < 0) {
          offsetCol -= 1
        } else {
          offsetCol += 1
        }
      } else if (offsetCol < 0) {
        offsetCol = 1
      } else {
        break
      }
    }
    let countNa = 1
    let offsetNa = -1
    while(countNa < 5) {
      if (y + offsetNa >= 0 && y + offsetNa <= ROWS -1 && x + offsetNa >= 0 && x + offsetNa <= ROWS -1 && state.arr[x + offsetNa][y + offsetNa] === target) {
        countNa += 1
        if (countNa >= 5) {
          break
        }
        if (offsetNa < 0) {
          offsetNa -= 1
        } else {
          offsetNa += 1
        }
      } else if (offsetNa < 0) {
        offsetNa = 1
      } else {
        break
      }
    }
    let countPie = 1
    let offsetPie = -1
    while(countPie < 5) {
      if (y - offsetPie >= 0 && y - offsetPie <= ROWS -1 && x + offsetPie >= 0 && x + offsetPie <= ROWS -1 && state.arr[x + offsetPie][y - offsetPie] === target) {
        countPie += 1
        if (countPie >= 5) {
          break
        }
        if (offsetPie < 0) {
          offsetPie -= 1
        } else {
          offsetPie += 1
        }
      } else if (offsetPie < 0) {
        offsetPie = 1
      } else {
        break
      }
    }
    return [
      countRow,
      countCol,
      countPie,
      countNa,
    ]
  }

  const checkWin = ([x, y]: [number, number]) => { // 检查胜利， 上一手坐标
    let result = false
    let target = state.arr[x][y]
    // 检查行胜利
    let rowCount = 1 // 累计数
    let offsetRow = -1 // 偏移量 (命名风格不统一)
    while(rowCount < 5) {
      if (x + offsetRow >= 0 && x + offsetRow <= ROWS - 1 && state.arr[x + offsetRow][y] === target) {
        rowCount += 1
        if (rowCount >= 5) {
          break
        }
        if (offsetRow < 0) {
          offsetRow -= 1
        } else {
          offsetRow += 1
        }
      } else if (offsetRow < 0) {
        offsetRow = 1
      } else {
        break
      }
    }
    if (rowCount >= 5) {
      result = true
    }
    // 检查列胜利
    let countCol = 1 // 累计数
    let offsetCol = -1 // 偏移量(命名风格统一)
    while(countCol < 5) {
      if (y + offsetCol >= 0 && y + offsetCol <= ROWS -1 && state.arr[x][y + offsetCol] === target) {
        countCol += 1
        if (countCol >= 5) {
          break
        }
        if (offsetCol < 0) {
          offsetCol -= 1
        } else {
          offsetCol += 1
        }
      } else if (offsetCol < 0) {
        offsetCol = 1
      } else {
        break
      }
    }
    if (countCol >= 5) {
      result = true
    }

    // 检查捺胜利
    let countNa = 1
    let offsetNa = -1
    while(countNa < 5) {
      if (y + offsetNa >= 0 && y + offsetNa <= ROWS -1 && x + offsetNa >= 0 && x + offsetNa <= ROWS -1 && state.arr[x + offsetNa][y + offsetNa] === target) {
        countNa += 1
        if (countNa >= 5) {
          break
        }
        if (offsetNa < 0) {
          offsetNa -= 1
        } else {
          offsetNa += 1
        }
      } else if (offsetNa < 0) {
        offsetNa = 1
      } else {
        break
      }
    }
    if (countNa >= 5) {
      result = true
    }
    //检查撇胜利
    let countPie = 1
    let offsetPie = -1
    while(countPie < 5) {
      if (y - offsetPie >= 0 && y - offsetPie <= ROWS -1 && x + offsetPie >= 0 && x + offsetPie <= ROWS -1 && state.arr[x + offsetPie][y - offsetPie] === target) {
        countPie += 1
        if (countPie >= 5) {
          break
        }
        if (offsetPie < 0) {
          offsetPie -= 1
        } else {
          offsetPie += 1
        }
      } else if (offsetPie < 0) {
        offsetPie = 1
      } else {
        break
      }
    }
    if (countPie >= 5) {
      result = true
    }
    if (result) {
      state.status = "end"
    } else {
      state.isBlack = !state.isBlack
    }
  }

  const clearDown = (x:number, y:number) => {
    if (x < 0  || y < 0) {
      return 
    }
    const ctx = context.value as CanvasRenderingContext2D
    ctx.clearRect(x * BOXSIZE + PADDING - 0.5 * BOXSIZE, y * BOXSIZE + PADDING - 0.5 * BOXSIZE, BOXSIZE, BOXSIZE)
      ctx.beginPath()
      ctx.moveTo(parseInt(String((Math.max(x - 0.5, 0)) * BOXSIZE + PADDING)) + 0.5, parseInt(String(y * BOXSIZE + PADDING)) + 0.5)
      ctx.lineTo(parseInt(String(Math.min(x + 0.5, ROWS - 1) * BOXSIZE + PADDING)) + 0.5, parseInt(String(y * BOXSIZE + PADDING)) + 0.5)
      ctx.stroke();
      ctx.beginPath()
      ctx.moveTo(parseInt(String(x * BOXSIZE + PADDING)) + 0.5, parseInt(String((Math.max(y - 0.5, 0)) * BOXSIZE + PADDING)) + 0.5)
      ctx.lineTo(parseInt(String(x * BOXSIZE + PADDING)) + 0.5, parseInt(String((Math.min(y + 0.5, ROWS - 1)) * BOXSIZE + PADDING)) + 0.5)
      ctx.stroke();
  }

  const setDown = (i: number, j: number) => {
    if (state.arr[i][j] !== 0) { // 判断当前位置是否有棋子
      return false
    }
    state.arr[i][j] = state.isBlack ? 1 : 2
    state.history.unshift({x: i, y: j})
    // 清楚上一个视觉辅助棋子，并重置视觉辅助棋子坐标，防止删除当前棋子
    const [prevX, prevY] = state.mouse
    clearDown(prevX, prevY)
    state.mouse = [-1, -1]

    const ctx = context.value as CanvasRenderingContext2D

    ctx.beginPath();
    ctx.arc(i * BOXSIZE + PADDING, j * BOXSIZE + PADDING, BOXSIZE / 2 - 3, 0, Math.PI * 2)
    const gradientStyle = ctx.createRadialGradient(
      i * BOXSIZE + PADDING + 2,
      j * BOXSIZE + PADDING - 2,
      0,
      i * BOXSIZE + PADDING ,
      j * BOXSIZE + PADDING,
      BOXSIZE / 2,
    );
    if (state.isBlack) {
      gradientStyle.addColorStop(0,'#aaa');
      gradientStyle.addColorStop(1, "#000");
    } else {
      gradientStyle.addColorStop(0,'#fff');
      gradientStyle.addColorStop(1,'#ccc');
    }
    ctx.fillStyle = gradientStyle
    ctx.fill();
    checkWin([i, j])
    return true
  }
  

  const toCheat = () => {
    const {x, y} = state.history[0]
    clearDown(x, y)
    state.arr[x][y] = 0
    if (!state.isRobot) {
      state.isBlack = !state.isBlack
    } else {
      const {x:x2, y:y2} = state.history[1]
      clearDown(x2, y2)
      state.arr[x2][y2] = 0
      state.history.shift()
    }
    state.history.shift()
  }

  const fakeDown = (xpx: number, ypx: number) => {
    if (state.isRobot && state.isBlack) {
      return
    }
    if (xpx < PADDING / 2 || ypx < PADDING / 2 || xpx > (SIZE - PADDING / 2) || ypx > (SIZE - PADDING / 2) ) {
      return 
    } else {
      const x = Math.abs(Math.round((xpx - PADDING) / BOXSIZE))
      const y = Math.abs(Math.round((ypx - PADDING) / BOXSIZE))

      // 清楚上一个视觉辅助
      const [prevX, prevY] = state.mouse
      clearDown(prevX, prevY)
      if (state.arr[x][y] === 0) {
        state.mouse = [x, y] // 记录坐标，绘制视觉辅助
        if (x >= 0 && y >= 0 && context.value) {
        const ctx = context.value
        ctx.beginPath();
        ctx.arc(x * BOXSIZE + PADDING, y * BOXSIZE + PADDING, BOXSIZE / 2 - 3, 0, Math.PI * 2)
        const gradientStyle = ctx.createRadialGradient(
          x * BOXSIZE + PADDING + 2,
          y * BOXSIZE + PADDING - 2,
          0,
          x * BOXSIZE + PADDING ,
          y * BOXSIZE + PADDING,
          BOXSIZE / 2,
        );
        if (state.isBlack) {
          gradientStyle.addColorStop(0,'#aaa');
          gradientStyle.addColorStop(1, "rgba(0, 0, 0, 0.5)");
        } else {
          gradientStyle.addColorStop(0, '#FFF');
          gradientStyle.addColorStop(1,'rgba(204, 204, 204, 0.8)');
        }
        ctx.fillStyle = gradientStyle
        ctx.fill();
      }
      }
    }
  }

  // 随缘人机
  const robotDownSuiYuan = () => {
    let x = Math.floor(Math.random() * ROWS)
    let y = Math.floor(Math.random() * ROWS)
    let result = setDown(x, y)  
    if (!result) {
      robotDownSuiYuan() 
    }
  }

  // 简单人机
  const robotDownEasy = () => {
    let sco = 0
    let x = 0
    let y = 0
    for(let i = 0; i < ROWS; i++) {
      for(let j = 0; j < COLS; j++) {
        let currentSco = SCORE[i][j] // 当前位置分数
        if (state.arr[i][j]) {
          currentSco = -1
        } else {
          const counts = checkCount(i, j, 1) // 当前棋子分数
          if (Math.max(...counts) === 5) {
            currentSco += 1000
          }
          if (Math.max(...counts) === 4) {
            currentSco += 900
          }
          if (Math.max(...counts) === 3) {
            currentSco += 600
          }
          if (Math.max(...counts) === 2) {
            currentSco += 100
          }
      
          if (sco <= currentSco) {
            x = i
            y = j
            sco = currentSco
          }
        }
      }  
    }
    console.log("最终结果", x, y)
    setDown(x, y)
  }

  const addFunc = () => {
    const ctx = context.value as CanvasRenderingContext2D
    ctx.canvas.onmousemove = _.throttle((e: MouseEvent) => {
      if (state.status === 'running') {
        fakeDown(e.offsetX, e.offsetY)
      }
    }, 100)
    ctx.canvas.onmouseleave = () => {
      if (state.status === 'running') {
        const [prevX, prevY] = state.mouse
        clearDown(prevX, prevY)
      }
    }
    ctx.canvas.onmousedown = (e:MouseEvent) => {
      if (state.isRobot && state.isBlack) {
        return
      }
      if (state.status === 'running') {
        const x = e.offsetX
        const y = e.offsetY
        if (x >= PADDING / 2 && y >= PADDING / 2 && x <= (SIZE - PADDING / 2) && y <= (SIZE - PADDING / 2)) {
          const i = Math.abs(Math.round((x - PADDING) / BOXSIZE))
          const j = Math.abs(Math.round((y - PADDING) / BOXSIZE))
          setDown(i, j)
        }
      }
    }
  }

  const init = ( ) => {
    const ctx = context.value as CanvasRenderingContext2D
    ctx.strokeStyle = "#232423"
    ctx.lineWidth = 1;
    for(let i = 0; i <= ROWS; i++ ) {
      ctx.beginPath()
      ctx.moveTo(parseInt(String(PADDING + i * BOXSIZE)) + 0.5, parseInt(String(PADDING)) + 0.5)
      ctx.lineTo(parseInt(String(PADDING + i * BOXSIZE)) + 0.5, parseInt(String(SIZE - PADDING)) + 0.5)
      ctx.stroke();
      ctx.beginPath()
      ctx.moveTo(parseInt(String(PADDING)) + 0.5, parseInt(String(PADDING + i * BOXSIZE)) + 0.5)
      ctx.lineTo(parseInt(String(SIZE - PADDING)) + 0.5, parseInt(String(PADDING + i * BOXSIZE)) + 0.5)
      ctx.stroke(); 
    }
  }

  onMounted(() => {
    const ctx  = (canvas.value as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D
    context.value = ctx
    init()
    addFunc()
  })

  watchEffect(() => {
    if (state.status === 'ready') {
      state.isBlack = true
    }
    if (state.status === 'running') {
      if (state.isRobot && state.isBlack) {
        // robotDownSuiYuan()
        robotDownEasy()
      }
    }
  })

</script>

<template>
  <div class="bg"></div>
  <h3>棋逢对手&nbsp;将遇良才</h3>
  <div class="fix">
    <h3 v-if="state.status === 'running'">当前棋手：{{ state.isBlack ? '黑' : "白" }}</h3>
  </div>
  <canvas ref="canvas" class="board" :width="SIZE" :height="SIZE"></canvas>
  <div class="tools">
    <button v-if="state.status === 'ready'" @click="start">人人对战</button>
    <button v-if="state.status === 'ready'" @click="startRobot" style="margin-left: 6px;">人机对战</button>
    <button v-if="state.status === 'running'" v-bind:disabled="state.history.length === 0 || (state.isRobot && state.history.length <= 2)" @click="toCheat">悔棋</button>
    <button v-if="state.status === 'end'" @click="restart">恭喜{{ state.isBlack ? '黑' : "白" }}棋技高一筹</button>
  </div>
</template>

<style scoped>
  .bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
    background: url('../assets/bg.jpeg') no-repeat center / cover;
    opacity: 0.6;
  }
  .board {
    border: 2px solid #232423;
    background: rgba(249, 201, 19, 0.4);
    cursor: pointer;
  }
  .tools {
    height: 100px;
  }
  .fix {
    height: 30px;
    min-width: 1px;
  }
</style>
