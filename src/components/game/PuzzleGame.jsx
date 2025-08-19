'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { getGameIdByKey } from '@/lib/games'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Configuration object - dynamic and configurable
const PUZZLE_CONFIG = {
  gridSize: 3,
  defaultImage: '/puzzle.jpg',
  // Game states
  states: {
    ready: 'ready',
    playing: 'playing',
    solved: 'solved'
  },
  // UI text and messages
  ui: {
    title: 'Image Puzzle Game',
    description: 'Select a tile, then click an adjacent tile to swap them. Rearrange to form the complete picture and earn {points} points!',
    instructions: {
      title: 'How to Play:',
      steps: [
        '1. Click a tile to select it (it will be highlighted in blue)',
        '2. Click an adjacent tile to swap them',
        '3. Rearrange all tiles to form the complete picture',
        '4. Complete the puzzle to earn {points} points!'
      ],
      startButton: 'Start Game'
    },
    gameStatus: {
      tileSelected: 'Tile selected! Click an adjacent tile to swap.',
      default: 'Click a tile to select it, then click an adjacent tile to swap.',
      reminder: 'Rearrange the tiles to match the original image',
      complete: 'Complete the puzzle to earn {points} points!'
    },
    buttons: {
      playAgain: 'Play Again'
    }
  },
  // Success messages
  messages: {
    solved: {
      title: '🎉 Puzzle Solved!',
      subtitle: 'Congratulations!',
      moves: 'You solved the puzzle in {moves} moves',
      timeTaken: 'Time taken: {time}',
      score: 'Points earned: {score}'
    }
  },
  // Score calculation - configurable
  scoring: {
    baseScore: 20,
    movePenalty: 0,
    timePenalty: 0
  }
}

// Utility functions
function createSolvedTiles(gridSize) {
  const tiles = []
  for (let i = 0; i < gridSize * gridSize; i += 1) {
    tiles.push(i)
  }
  return tiles
}

// Dynamic text replacement function
function replacePlaceholders(text, replacements) {
  let result = text
  Object.entries(replacements).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value)
  })
  return result
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

function areAdjacent(index1, index2, gridSize) {
  const row1 = Math.floor(index1 / gridSize)
  const col1 = index1 % gridSize
  const row2 = Math.floor(index2 / gridSize)
  const col2 = index2 % gridSize
  
  // Check if tiles are adjacent (same row and adjacent column, or same column and adjacent row)
  return (Math.abs(row1 - row2) === 1 && col1 === col2) || 
         (Math.abs(col1 - col2) === 1 && row1 === row2)
}

export default function PuzzleGame({ user, imageSrc = PUZZLE_CONFIG.defaultImage }) {
  const [tiles, setTiles] = useState([])
  const [moves, setMoves] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [gameState, setGameState] = useState(PUZZLE_CONFIG.states.ready)
  const [selectedTile, setSelectedTile] = useState(null)
  const [loading, setLoading] = useState(false)
  
  // Store timer reference to stop it immediately when game solves
  const timerRef = useRef(null)
  
  // Store exact start time for precise timing
  const gameStartTimeRef = useRef(null)

  // Memoized function to start new game
  const startNewGame = useCallback(() => {
    const solvedTiles = createSolvedTiles(PUZZLE_CONFIG.gridSize)
    const shuffledTiles = shuffleTiles(solvedTiles)
    setTiles(shuffledTiles)
    setMoves(0)
    setElapsedTime(0)
    setGameState(PUZZLE_CONFIG.states.ready)
    setSelectedTile(null)
  }, [])

  // Memoized function to start playing
  const startPlaying = useCallback(() => {
    setGameState(PUZZLE_CONFIG.states.playing)
    setElapsedTime(0) // Reset timer when starting
    gameStartTimeRef.current = Date.now() // Store exact start time
  }, [])

  // Memoized function to handle tile click
  const handleTileClick = useCallback((tileIndex) => {
    if (gameState !== PUZZLE_CONFIG.states.playing) return

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
    if (areAdjacent(selectedTile, tileIndex, PUZZLE_CONFIG.gridSize)) {
      // Swap the tiles
      const newTiles = [...tiles]
      ;[newTiles[selectedTile], newTiles[tileIndex]] = [newTiles[tileIndex], newTiles[selectedTile]]
      
      setTiles(newTiles)
      setMoves(prev => prev + 1)
      setSelectedTile(null) // Deselect after move

      // Check if puzzle is solved
      if (isSolved(newTiles)) {
        // Stop the timer IMMEDIATELY to prevent any race conditions
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        
        // Calculate EXACT time using performance.now() for precision
        const exactEndTime = Date.now()
        const exactElapsedSeconds = Math.floor((exactEndTime - gameStartTimeRef.current) / 1000)
        
        // Stop the timer immediately to prevent race condition
        setGameState(PUZZLE_CONFIG.states.solved)
        // Use the exact calculated values, not React state
        const finalMoves = moves + 1
        const finalTime = exactElapsedSeconds
        // Pass the actual values that will be saved, not the stale state
        saveScoreWithValues(finalMoves, finalTime)
      }
    } else {
      // Tiles are not adjacent, select the new tile instead
      setSelectedTile(tileIndex)
    }
  }, [gameState, selectedTile, tiles])

  // Memoized function to format time
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Memoized function to calculate score - fixed to give consistent 20 points
  const calculateScore = useCallback((moves, time) => {
    return PUZZLE_CONFIG.scoring.baseScore // Always give 20 points for winning
  }, [])

  // Memoized function to save score with actual values
  const saveScoreWithValues = useCallback(async (actualMoves, actualTime) => {
    try {
      const gameId = await getGameIdByKey('puzzle')
      if (gameId) {
        const { error } = await supabase.from('game_results').insert([
          {
            user_id: user.id,
            game_id: gameId,
            score: calculateScore(actualMoves, actualTime),
            details: { 
              moves: actualMoves,
              time_taken: actualTime,
              solved: true
            },
          },
        ])
        if (error) console.error('Error saving score:', error)
      }
    } catch (error) {
      console.error('Error saving score:', error)
    }
  }, [user.id, calculateScore])

  // Keep the old function for backward compatibility
  const saveScore = useCallback(async () => {
    saveScoreWithValues(moves, elapsedTime)
  }, [moves, elapsedTime, saveScoreWithValues])

  // Memoized function to render tile
  const renderTile = useCallback((tileValue, index) => {
    const percent = 100 / (PUZZLE_CONFIG.gridSize - 1)
    const x = (tileValue % PUZZLE_CONFIG.gridSize) * percent
    const y = Math.floor(tileValue / PUZZLE_CONFIG.gridSize) * percent

    const isSelected = selectedTile === index
    const isAdjacentToSelected = selectedTile !== null && areAdjacent(selectedTile, index, PUZZLE_CONFIG.gridSize)

    return (
      <button
        key={index}
        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
          isSelected 
            ? 'border-blue-500 ring-4 ring-blue-300 scale-105' 
            : isAdjacentToSelected 
              ? 'border-green-400 ring-2 ring-green-200 hover:border-green-500'
              : 'border-gray-300 hover:border-gray-400'
        } ${gameState === PUZZLE_CONFIG.states.playing ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={() => handleTileClick(index)}
        disabled={gameState !== PUZZLE_CONFIG.states.playing}
        aria-label={`tile ${tileValue + 1}`}
      >
        <div
          className="absolute inset-0 bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${imageSrc})`,
            backgroundSize: `${PUZZLE_CONFIG.gridSize * 100}% ${PUZZLE_CONFIG.gridSize * 100}%`,
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
  }, [selectedTile, gameState, imageSrc, handleTileClick])

  useEffect(() => {
    startNewGame()
  }, [startNewGame])

  useEffect(() => {
    if (gameState === PUZZLE_CONFIG.states.playing) {
      timerRef.current = setInterval(() => {
        if (gameStartTimeRef.current) {
          const exactElapsed = Math.floor((Date.now() - gameStartTimeRef.current) / 1000)
          setElapsedTime(exactElapsed)
        }
      }, 1000)
    } else {
      // Clear timer immediately when game is not playing
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [gameState])

  // Memoized game stats component
  const GameStats = useMemo(() => (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
      <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full font-semibold">
        ⏰ {formatTime(elapsedTime)}
      </div>
      <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
        Moves: {moves}
      </div>
      <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
        Player: {user?.user_metadata?.username || user?.email}
      </div>
    </div>
  ), [elapsedTime, moves, user, formatTime])

  // Memoized game instructions component
  const GameInstructions = useMemo(() => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-center">
      <h3 className="font-semibold text-blue-800 mb-2">{PUZZLE_CONFIG.ui.instructions.title}</h3>
      <div className="text-blue-700 text-sm space-y-1">
        {PUZZLE_CONFIG.ui.instructions.steps.map((step, index) => (
          <p key={index} dangerouslySetInnerHTML={{ 
            __html: replacePlaceholders(step, { points: PUZZLE_CONFIG.scoring.baseScore })
          }} />
        ))}
      </div>
      <Button 
        onClick={startPlaying} 
        className="mt-3 bg-blue-600 hover:bg-blue-700"
      >
        {PUZZLE_CONFIG.ui.instructions.startButton}
      </Button>
    </div>
  ), [startPlaying])

  // Memoized puzzle grid component
  const PuzzleGrid = useMemo(() => (
    <div className="w-full max-w-sm mx-auto mb-6">
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${PUZZLE_CONFIG.gridSize}, minmax(0, 1fr))` }}
      >
        {tiles.map((tileValue, index) => renderTile(tileValue, index))}
      </div>
    </div>
  ), [tiles, renderTile])

  // Memoized game status component
  const GameStatus = useMemo(() => (
    <div className="text-center space-y-3">
      {selectedTile !== null ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 font-semibold">
            {PUZZLE_CONFIG.ui.gameStatus.tileSelected}
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-gray-700">
            {PUZZLE_CONFIG.ui.gameStatus.default}
          </p>
        </div>
      )}
      <p className="text-sm text-gray-600">
        {PUZZLE_CONFIG.ui.gameStatus.reminder}
      </p>
    </div>
  ), [selectedTile])

  if (gameState === PUZZLE_CONFIG.states.solved) {
    // Calculate EXACT same values for display as used in saveScoreWithValues
    const exactEndTime = Date.now()
    const exactElapsedSeconds = Math.floor((exactEndTime - gameStartTimeRef.current) / 1000)
    const finalMoves = moves + 1
    const finalTime = exactElapsedSeconds
    const score = calculateScore(finalMoves, finalTime)
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{PUZZLE_CONFIG.messages.solved.title}</h1>
            
            {/* Show the completed image clearly */}
            <div className="mb-6">
              <img
                src={imageSrc}
                alt="Completed Puzzle"
                className="w-full max-w-md mx-auto rounded-lg shadow-lg border-4 border-green-500"
              />
            </div>
            
            <div className="bg-green-100 text-green-800 p-6 rounded-lg mb-6">
              <h2 className="text-2xl font-bold mb-2">{PUZZLE_CONFIG.messages.solved.subtitle}</h2>
              <p className="text-lg mb-2">{PUZZLE_CONFIG.messages.solved.moves.replace('{moves}', finalMoves)}</p>
              <p className="text-lg">{PUZZLE_CONFIG.messages.solved.timeTaken.replace('{time}', formatTime(finalTime))}</p>
              <p className="text-lg font-semibold">{PUZZLE_CONFIG.messages.solved.score.replace('{score}', score)}</p>
            </div>
            <Button onClick={startNewGame} className="text-lg px-8 py-3">
              {PUZZLE_CONFIG.ui.buttons.playAgain}
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
            <CardTitle className="text-2xl md:text-3xl">{PUZZLE_CONFIG.ui.title}</CardTitle>
            <CardDescription className="text-base">
              {replacePlaceholders(PUZZLE_CONFIG.ui.description, { points: PUZZLE_CONFIG.scoring.baseScore })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Game Stats */}
            {GameStats}

            {/* Game Instructions */}
            {gameState === PUZZLE_CONFIG.states.ready && GameInstructions}

            {/* Puzzle Grid */}
            {PuzzleGrid}

            {/* Game Status */}
            {gameState === PUZZLE_CONFIG.states.playing && GameStatus}
          </CardContent>
        </Card>

        {/* Game instructions reminder */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            {replacePlaceholders(PUZZLE_CONFIG.ui.gameStatus.complete, { points: PUZZLE_CONFIG.scoring.baseScore })}
          </p>
        </div>
      </div>
    </div>
  )
}



