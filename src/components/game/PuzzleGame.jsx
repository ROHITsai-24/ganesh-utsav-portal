'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getGameIdByKey } from '@/lib/games'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const GRID_SIZE = 3 // 3x3 grid

function createSolvedTiles() {
  const tiles = []
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i += 1) {
    tiles.push(i)
  }
  return tiles
}

function shuffleTiles(tiles) {
  const shuffled = [...tiles]
  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function isSolved(tiles) {
  for (let i = 0; i < tiles.length; i += 1) {
    if (tiles[i] !== i) return false
  }
  return true
}

function areAdjacent(index1, index2) {
  const row1 = Math.floor(index1 / GRID_SIZE)
  const col1 = index1 % GRID_SIZE
  const row2 = Math.floor(index2 / GRID_SIZE)
  const col2 = index2 % GRID_SIZE
  
  // Check if tiles are adjacent (same row and adjacent column, or same column and adjacent row)
  return (Math.abs(row1 - row2) === 1 && col1 === col2) || 
         (Math.abs(col1 - col2) === 1 && row1 === row2)
}

export default function PuzzleGame({ user, imageSrc = '/puzzle.jpg' }) {
  const [tiles, setTiles] = useState([])
  const [moves, setMoves] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [gameState, setGameState] = useState('ready') // ready, playing, solved, timeup
  const [selectedTile, setSelectedTile] = useState(null) // Index of selected tile
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    startNewGame()
  }, [])

  useEffect(() => {
    let timer
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
    } else if (timeLeft === 0 && gameState === 'playing') {
      handleTimeUp()
    }
    return () => clearTimeout(timer)
  }, [timeLeft, gameState])

  const startNewGame = () => {
    const solvedTiles = createSolvedTiles()
    const shuffledTiles = shuffleTiles(solvedTiles)
    setTiles(shuffledTiles)
    setMoves(0)
    setTimeLeft(30)
    setGameState('ready')
    setSelectedTile(null)
  }

  const startPlaying = () => {
    setGameState('playing')
  }

  const handleTileClick = (tileIndex) => {
    if (gameState !== 'playing') return

    // If no tile is selected, select this tile
    if (selectedTile === null) {
      setSelectedTile(tileIndex)
      return
    }

    // If same tile is clicked again, deselect it
    if (selectedTile === tileIndex) {
      setSelectedTile(null)
      return
    }

    // If different tile is clicked, check if they're adjacent
    if (areAdjacent(selectedTile, tileIndex)) {
      // Swap the tiles
      const newTiles = [...tiles]
      ;[newTiles[selectedTile], newTiles[tileIndex]] = [newTiles[tileIndex], newTiles[selectedTile]]
      
      setTiles(newTiles)
      setMoves(moves + 1)
      setSelectedTile(null) // Deselect after move

      // Check if puzzle is solved
      if (isSolved(newTiles)) {
        setGameState('solved')
        saveScore()
      }
    } else {
      // Tiles are not adjacent, select the new tile instead
      setSelectedTile(tileIndex)
    }
  }

  const handleTimeUp = () => {
    setGameState('timeup')
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const saveScore = async () => {
    try {
      const gameId = await getGameIdByKey('puzzle')
      if (gameId) {
        const { error } = await supabase.from('game_results').insert([
          {
            user_id: user.id,
            game_id: gameId,
            score: Math.max(10, 100 - (30 - timeLeft)), // Score based only on time, not moves
            details: { 
              moves: moves,
              time_taken: 30 - timeLeft,
              solved: true
            },
          },
        ])
        if (error) console.error('Error saving score:', error)
      }
    } catch (error) {
      console.error('Error saving score:', error)
    }
  }

  const renderTile = (tileValue, index) => {
    const percent = 100 / (GRID_SIZE - 1)
    const x = (tileValue % GRID_SIZE) * percent
    const y = Math.floor(tileValue / GRID_SIZE) * percent

    const isSelected = selectedTile === index
    const isAdjacentToSelected = selectedTile !== null && areAdjacent(selectedTile, index)

    return (
      <button
        key={index}
        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
          isSelected 
            ? 'border-blue-500 ring-4 ring-blue-300 scale-105' 
            : isAdjacentToSelected 
              ? 'border-green-400 ring-2 ring-green-200 hover:border-green-500'
              : 'border-gray-300 hover:border-gray-400'
        } ${gameState === 'playing' ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={() => handleTileClick(index)}
        disabled={gameState !== 'playing'}
        aria-label={`tile ${tileValue + 1}`}
      >
        <div
          className="absolute inset-0 bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${imageSrc})`,
            backgroundSize: `${GRID_SIZE * 100}% ${GRID_SIZE * 100}%`,
            backgroundPosition: `${x}% ${y}%`,
          }}
        />
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
            ✓
          </div>
        )}
        {/* Adjacent indicator */}
        {isAdjacentToSelected && (
          <div className="absolute top-1 left-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
            ↔
          </div>
        )}
      </button>
    )
  }

  if (gameState === 'solved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">🎉 Puzzle Solved!</h1>
            
            {/* Show the completed image clearly */}
            <div className="mb-6">
              <img
                src={imageSrc}
                alt="Completed Puzzle"
                className="w-full max-w-md mx-auto rounded-lg shadow-lg border-4 border-green-500"
              />
            </div>
            
            <div className="bg-green-100 text-green-800 p-6 rounded-lg mb-6">
              <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
              <p className="text-lg mb-2">You solved the puzzle in {moves} moves</p>
              <p className="text-lg">Time remaining: {formatTime(timeLeft)}</p>
              <p className="text-lg font-semibold">Score: {Math.max(10, 100 - (30 - timeLeft))}</p>
            </div>
            <Button onClick={startNewGame} className="text-lg px-8 py-3">
              Play Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'timeup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">⏰ Time's Up!</h1>
            <div className="bg-red-100 text-red-800 p-6 rounded-lg mb-6">
              <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
              <p className="text-lg mb-2">You made {moves} moves</p>
              <p className="text-lg">Try to solve it faster next time!</p>
            </div>
            <Button onClick={startNewGame} className="text-lg px-8 py-3">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl">Image Puzzle Game</CardTitle>
            <CardDescription className="text-base">
              Select a tile, then click an adjacent tile to swap them. Rearrange to form the complete picture within 30 seconds!
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Game Stats */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full font-semibold">
                ⏰ {formatTime(timeLeft)}
              </div>
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
                Moves: {moves}
              </div>
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
                Player: {user?.user_metadata?.username || user?.email}
              </div>
            </div>

            {/* Game Instructions */}
            {gameState === 'ready' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-center">
                <h3 className="font-semibold text-blue-800 mb-2">How to Play:</h3>
                <p className="text-blue-700 text-sm">
                  1. Click a tile to select it (it will be highlighted in blue)<br/>
                  2. Click an adjacent tile to swap them<br/>
                  3. Rearrange all tiles to form the complete picture<br/>
                  4. You have 30 seconds to solve it!
                </p>
                <Button 
                  onClick={startPlaying} 
                  className="mt-3 bg-blue-600 hover:bg-blue-700"
                >
                  Start Game
                </Button>
              </div>
            )}

            {/* Puzzle Grid */}
            <div className="w-full max-w-sm mx-auto mb-6">
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
              >
                {tiles.map((tileValue, index) => renderTile(tileValue, index))}
              </div>
            </div>

            {/* Game Status */}
            {gameState === 'playing' && (
              <div className="text-center space-y-3">
                {selectedTile !== null ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-800 font-semibold">
                      Tile selected! Click an adjacent tile to swap.
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-gray-700">
                      Click a tile to select it, then click an adjacent tile to swap.
                    </p>
                  </div>
                )}
                <p className="text-sm text-gray-600">
                  Rearrange the tiles to match the original image
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Game instructions reminder */}
        <div className="text-center mt-8">
          <p className="text-gray-600">Complete the puzzle to see your score!</p>
        </div>
      </div>
    </div>
  )
}



