import produce from 'immer'
import { useEffect, useState } from 'react'
import './App.scss'

type Direction = 'up' | 'down' | 'left' | 'right'

type Board = (number | undefined)[]

type Row = Board

const makeEmptyBoard = (): Board => new Array(16).fill(undefined)

const areBoardsEqual = (board1: Board, board2: Board): boolean =>
  board1.every((value, index) => value === board2[index])

const spawnValue = (board: Board): Board => {
  const emptyIndices = board.flatMap((value, index) => (value ? [] : [index]))
  return emptyIndices.length === 0
    ? board
    : produce(board, (draft) => {
        draft[emptyIndices[Math.floor(emptyIndices.length * Math.random())]] =
          Math.random() < 0.1 ? 4 : 2
      })
}

const rotationMatrix = [3, 7, 11, 15, 2, 6, 10, 14, 1, 5, 9, 13, 0, 4, 8, 12]

const rotateBoardLeft = (board: Board, times: number = 1): Board =>
  times === 0
    ? board
    : rotateBoardLeft(
        board.map((_, index) => board[rotationMatrix[index]]),
        times - 1
      )

const shiftRowLeft = (row: Row): Row => {
  return produce(row, (shiftedRow) => {
    const lockedIndices: number[] = []
    for (const i of [1, 2, 3]) {
      const value = shiftedRow[i]
      if (!value) {
        continue
      }

      for (let j = i - 1; j >= 0; j--) {
        const otherValue = shiftedRow[j]
        if (!otherValue) {
          shiftedRow[j] = value
          shiftedRow[j + 1] = undefined
        } else {
          if (value === otherValue && !lockedIndices.includes(j)) {
            shiftedRow[j] = value * 2
            shiftedRow[j + 1] = undefined
            lockedIndices.push(j)
          }

          break
        }
      }
    }
  })
}

const shiftBoardLeft = (board: Board): Board => {
  return [0, 4, 8, 12].flatMap((startIndex) =>
    shiftRowLeft(board.slice(startIndex, startIndex + 4))
  )
}

const shiftBoard = (board: Board, direction: Direction): Board => {
  const rotations = { up: 1, down: 3, left: 0, right: 2 }[direction]
  return rotateBoardLeft(
    shiftBoardLeft(rotateBoardLeft(board, rotations)),
    (4 - rotations) % 4
  )
}

const isBoardStuck = (board: Board): boolean => {
  const changed = (otherBoard: Board): boolean =>
    !areBoardsEqual(board, otherBoard)
  return (
    !changed(shiftBoard(board, 'up')) &&
    !changed(shiftBoard(board, 'down')) &&
    !changed(shiftBoard(board, 'left')) &&
    !changed(shiftBoard(board, 'right'))
  )
}

export const App = () => {
  const [board, setBoard] = useState(spawnValue(makeEmptyBoard()))
  useEffect(() => {
    const handleKey = ({ key }: KeyboardEvent) => {
      const direction = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      }[key] as Direction | undefined
      if (!direction) {
        return
      }

      const shiftedBoard = shiftBoard(board, direction)
      if (areBoardsEqual(board, shiftedBoard)) {
        return
      }

      setBoard(spawnValue(shiftedBoard))
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  return (
    <div className='content'>
      <div className='title'>2048</div>
      <div className='board'>
        {board.map((cellValue, cellIndex) => (
          <div
            key={cellIndex}
            className={`cell${
              !cellValue ? '' : ` cell-${Math.log2(Math.min(cellValue, 2048))}`
            }`}
          >
            {cellValue ?? ''}
          </div>
        ))}
        {isBoardStuck(board) && <div className='lost-message'>:(</div>}
      </div>
    </div>
  )
}
