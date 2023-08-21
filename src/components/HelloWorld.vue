<script setup lang="ts">
  import { ref, onMounted, watchEffect, reactive} from 'vue'
  import * as _ from 'lodash'
  const canvas = ref<HTMLCanvasElement>()
  let context = ref<CanvasRenderingContext2D>()
  const SIZE = 500 // 棋盘大小
  const PADDING = 10 // 棋盘边框
  const ROWS = 20 // 行
  const COLS = 20 // 列
  const BOXSIZE = (SIZE - 2 * PADDING) / (ROWS - 1) // 每个单元格的大小
  // const DEFAULT_ARR = Array(ROWS).fill(Array(ROWS).fill(0)) // fill 填充的是整个对象的引用
  const DEFAULT_ARR = Array.from({length: ROWS}, ()=> new Array(COLS).fill(0));
  const state = reactive<{
    status: 'ready' | 'running' | 'end';
    arr: Array<Array<number>>;
    mouse: [number, number];
    isBlack: boolean;
    history: Array<{x:number, y: number}>
  }>({
    status: 'ready',
    arr: DEFAULT_ARR, // 棋盘数据
    mouse: [-1, -1], // 鼠标移动棋子位置
    isBlack: true,
    history: [],
  })

  const start  = () => {
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

  const checkWin = ([x, y]: [number, number]) => { // 检查胜利， 上一手坐标
    // console.log(x, y)
    let result = false
    let target = state.arr[x][y]
    // 检查行胜利
    let rowCount = 1 // 累计数
    let offsetRow = -1 // 偏移量 (命名风格不统一)
    while(rowCount < 5) {
      if (x + offsetRow >= 0 && x + offsetRow <= 19 && state.arr[x + offsetRow][y] === target) {
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
    // console.log("行胜利", rowCount)
    if (rowCount >= 5) {
      result = true
    }
    // 检查列胜利
    let countCol = 1 // 累计数
    let offsetCol = -1 // 偏移量(命名风格统一)
    while(countCol < 5) {
      if (y + offsetCol >= 0 && y + offsetCol <= 19 && state.arr[x][y + offsetCol] === target) {
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
    // console.log("列胜利", countCol)
    if (countCol >= 5) {
      result = true
    }

    // 检查捺胜利
    let countNa = 1
    let offsetNa = -1
    while(countNa < 5) {
      if (y + offsetNa >= 0 && y + offsetNa <= 19 && x + offsetNa >= 0 && x + offsetNa <= 19 && state.arr[x + offsetNa][y + offsetNa] === target) {
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
    // console.log("捺胜利", countNa)
    if (countNa >= 5) {
      result = true
    }
    //检查撇胜利
    let countPie = 1
    let offsetPie = -1
    while(countPie < 5) {
      if (y - offsetPie >= 0 && y - offsetPie <= 19 && x + offsetPie >= 0 && x + offsetPie <= 19 && state.arr[x + offsetPie][y - offsetPie] === target) {
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
    // console.log("撇胜利", countPie)
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

  const setDown = (x: number, y: number) => {
    if (x < PADDING / 2 || y < PADDING / 2 || x > (SIZE - PADDING / 2) || y > (SIZE - PADDING / 2) ) {
      return 
    } else {
      const i = Math.abs(Math.round((x - PADDING) / BOXSIZE))
      const j = Math.abs(Math.round((y - PADDING) / BOXSIZE))
      if (state.arr[i][j] !== 0) {
        return 
      }
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
      state.arr[i][j] = state.isBlack ? 1 : 2
      state.history.unshift({x:i, y:j})
      checkWin([i, j])
    }
  }

  const toCheat = () => {
    console.log(state.history)
    const {x, y} = state.history[0]
    clearDown(x, y)
    state.history.shift()
  }

  const fakeDown = (x: number, y: number) => {
    if (x < PADDING / 2 || y < PADDING / 2 || x > (SIZE - PADDING / 2) || y > (SIZE - PADDING / 2) ) {
      return 
    } else {
      const i = Math.abs(Math.round((x - PADDING) / BOXSIZE))
      const j = Math.abs(Math.round((y - PADDING) / BOXSIZE))
      const [prevX, prevY] = state.mouse
      clearDown(prevX, prevY)
      if (state.arr[i][j] === 0) {
        state.mouse = [i, j]
      }
    }
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
      if (state.status === 'running') {
        setDown(e.offsetX, e.offsetY)
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
      const [x, y]  = state.mouse
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
    <button v-if="state.status === 'ready'" @click="start">开始</button>
    <button v-if="state.status === 'running'" v-bind:disabled="state.history.length === 0" @click="toCheat">悔棋</button>
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
