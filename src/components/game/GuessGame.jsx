'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { getGameIdByKey } from '@/lib/games'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Configuration objects for dynamic content
const GAME_CONFIG = {
  title: 'Idol Guessing Game',
  totalQuestions: 3,
  timeLimit: 30,
  pointsPerQuestion: 10,
  welcomeMessage: 'Welcome, {username}!',
  gameCompleted: {
    title: 'Game Completed!',
    subtitle: 'Great job! You\'ve completed all questions.',
    buttonText: 'Play Again'
  },
  timeUp: {
    title: 'Time\'s Up!',
    subtitle: 'You ran out of time. Try to be faster next time!',
    buttonText: 'Play Again'
  },
  correct: {
    title: '🎉 Correct!',
    message: 'Great job! You got it right!',
    buttonText: 'Next Question',
    finalButtonText: 'Finish Game'
  },
  incorrect: {
    title: '❌ Wrong Answer',
    message: 'That\'s not correct. Try to do better on the next question!',
    buttonText: 'Next Question',
    finalButtonText: 'Finish Game'
  }
}

const QUESTION_CONFIG = {
  1: {
    title: 'Question 1: Guess the Idol!',
    description: 'Select the correct image of the idol from the options below',
    type: 'image',
    correctAnswer: '/puzzle.jpg'
  },
  2: {
    title: 'Question 2: Guess the Height',
    description: 'What is the height of this idol?',
    type: 'height',
    correctAnswer: '6\'0"'
  },
  3: {
    title: 'Question 3: Guess the Price',
    description: 'What is the price of this idol?',
    type: 'price',
    correctAnswer: '15000'
  }
}

const GAME_OPTIONS = {
  images: [
    { id: 1, src: '/ganeshIdols/download (1).jpg', alt: 'Ganesha Idol 1' },
    { id: 2, src: '/ganeshIdols/download (2).jpg', alt: 'Ganesha Idol 2' },
    { id: 3, src: '/ganeshIdols/download (3).jpg', alt: 'Ganesha Idol 3' },
    { id: 4, src: '/ganeshIdols/download (4).jpg', alt: 'Ganesha Idol 4' },
    { id: 5, src: '/ganeshIdols/download (5).jpg', alt: 'Ganesha Idol 5' },
    { id: 6, src: '/ganeshIdols/download.jpg', alt: 'Ganesha Idol 6' },
    { id: 7, src: '/ganeshIdols/buntymokal_5551.jpg', alt: 'Ganesha Idol 7' },
    { id: 8, src: '/ganeshIdols/Chinese Dragon Art.jpg', alt: 'Ganesha Idol 8' },
    { id: 9, src: '/ganeshIdols/7 SEPTEMBER 2024 HAPPY GANESH CHATURTHI.jpg', alt: 'Ganesha Idol 9' },
    { id: 10, src: '/puzzle.jpg', alt: 'Correct Idol Image' }
  ],
  heights: [
    { value: '5\'6"', label: '5\'6"' },
    { value: '5\'8"', label: '5\'8"' },
    { value: '5\'10"', label: '5\'10"' },
    { value: '6\'0"', label: '6\'0"' },
    { value: '6\'2"', label: '6\'2"' },
    { value: '6\'4"', label: '6\'4"' }
  ],
  prices: [
    { value: '12000', label: '₹12,000' },
    { value: '13500', label: '₹13,500' },
    { value: '15000', label: '₹15,000' },
    { value: '16500', label: '₹16,500' },
    { value: '18000', label: '₹18,000' },
    { value: '20000', label: '₹20,000' }
  ]
}

// Custom hook for game state management
const useGameState = (user) => {
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedHeight, setSelectedHeight] = useState('')
  const [selectedPrice, setSelectedPrice] = useState('')
  const [score, setScore] = useState(0)
  const [gameState, setGameState] = useState('ready')
  const [timeLeft, setTimeLeft] = useState(GAME_CONFIG.timeLimit)
  const [shuffledImages, setShuffledImages] = useState([])
  const [hasSaved, setHasSaved] = useState(false)
  const [playLimitExceeded, setPlayLimitExceeded] = useState(false)
  
  // Store time taken for each question
  const questionTimesRef = useRef([])
  // Store total time taken for saving
  const totalTimeRef = useRef(0)
  // Store when current question started
  const questionStartTimeRef = useRef(null)

  const resetGame = useCallback(() => {
    setCurrentQuestion(1)
    setSelectedImage(null)
    setSelectedHeight('')
    setSelectedPrice('')
    setScore(0)
    setGameState('ready')
    setTimeLeft(GAME_CONFIG.timeLimit)
    setHasSaved(false)
    setPlayLimitExceeded(false)
    questionTimesRef.current = []
    totalTimeRef.current = 0
    questionStartTimeRef.current = null
    
    // Shuffle images for the first question
    const shuffled = [...GAME_OPTIONS.images].sort(() => Math.random() - 0.5)
    setShuffledImages(shuffled)
  }, [])

  const startGame = useCallback(async () => {
    // Pre-game validation: Check if user can still play
    try {
      const response = await fetch('/api/check-play-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          gameKey: 'guess'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 403) {
          if (errorData.action === 'rejected_limit') {
            setPlayLimitExceeded(true)
            setGameState('limit_exceeded')
            return
          }
        }
        throw new Error('Failed to validate play limit')
      }

      const data = await response.json()
      if (!data.canPlay) {
        setPlayLimitExceeded(true)
        setGameState('limit_exceeded')
        return
      }

      // If validation passes, start the game
      setGameState('playing')
      questionStartTimeRef.current = Date.now() // Start timing first question
    } catch (error) {
      // BLOCK the game if validation fails - don't allow fallback
      setPlayLimitExceeded(true)
      setGameState('limit_exceeded')
    }
  }, [user?.id])

  const nextQuestion = useCallback(() => {
    if (currentQuestion < GAME_CONFIG.totalQuestions) {
      setCurrentQuestion(prev => prev + 1)
      setGameState('playing')
      setTimeLeft(GAME_CONFIG.timeLimit)
      questionStartTimeRef.current = Date.now() // Start timing next question
    } else {
      // Game completed - calculate total time from all questions
      const totalTime = questionTimesRef.current.reduce((sum, time) => sum + time, 0)
      setGameState('completed')
      totalTimeRef.current = totalTime
    }
  }, [currentQuestion])

  const checkAnswer = useCallback(() => {
    // Calculate time taken for this question when answer is submitted
    if (questionStartTimeRef.current) {
      const questionEndTime = Date.now()
      const timeTakenForQuestion = Math.floor((questionEndTime - questionStartTimeRef.current) / 1000)
      questionTimesRef.current.push(timeTakenForQuestion)
    }

    const questionConfig = QUESTION_CONFIG[currentQuestion]
    let isCorrect = false

    switch (questionConfig.type) {
      case 'image':
        const correctImage = shuffledImages.find(img => img.src === questionConfig.correctAnswer)
        isCorrect = selectedImage === correctImage?.id
        break
      case 'height':
        isCorrect = selectedHeight === questionConfig.correctAnswer
        break
      case 'price':
        isCorrect = selectedPrice === questionConfig.correctAnswer
        break
      default:
        isCorrect = false
    }

    // Update score internally
    if (isCorrect) {
      setScore(prev => prev + GAME_CONFIG.pointsPerQuestion)
    }

    // Show neutral state (no correct/incorrect feedback) - user clicks Next Question to continue
    setGameState('neutral')
  }, [currentQuestion, selectedImage, selectedHeight, selectedPrice, shuffledImages])

  const canProceed = useMemo(() => {
    switch (currentQuestion) {
      case 1: return selectedImage !== null
      case 2: return selectedHeight !== ''
      case 3: return selectedPrice !== ''
      default: return false
    }
  }, [currentQuestion, selectedImage, selectedHeight, selectedPrice])

  const handleContinue = useCallback(() => {
    if (currentQuestion < GAME_CONFIG.totalQuestions) {
      nextQuestion()
    } else {
      // Game completed - calculate total time from all questions
      const totalTime = questionTimesRef.current.reduce((sum, time) => sum + time, 0)
      totalTimeRef.current = totalTime
      setGameState('completed')
    }
  }, [currentQuestion, nextQuestion, setGameState])

  return {
    currentQuestion,
    selectedImage,
    selectedHeight,
    selectedPrice,
    score,
    gameState,
    timeLeft,
    shuffledImages,
    hasSaved,
    totalTimeRef,
    canProceed,
    playLimitExceeded,
    setSelectedImage,
    setSelectedHeight,
    setSelectedPrice,
    setGameState,
    setTimeLeft,
    setHasSaved,
    resetGame,
    startGame,
    nextQuestion,
    checkAnswer,
    handleContinue
  }
}

// Custom hook for timer management
const useTimer = (timeLeft, gameState, onTimeUp) => {
  useEffect(() => {
    let timer
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setTimeout(() => onTimeUp(timeLeft - 1), 1000)
    } else if (timeLeft === 0 && gameState === 'playing') {
      onTimeUp(0)
    }
    return () => clearTimeout(timer)
  }, [timeLeft, gameState, onTimeUp])
}

// Custom hook for score saving (optimized like puzzle game)
const useScoreSaver = (user, score, currentQuestion, totalTimeRef, onScoreSaved) => {
  const saveScore = useCallback(async () => {
    try {
      const gameId = await getGameIdByKey('guess')
      if (gameId) {
        // Use the total time calculated from all questions
        const exactTimeTaken = totalTimeRef.current || 0
        
        const response = await fetch('/api/game-results', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            game_id: gameId,
            score: score,
            details: { 
              final_score: score,
              questions_answered: currentQuestion,
              time_taken: exactTimeTaken
            },
          }),
        })

        const result = await response.json()
        
        if (result.success) {
          // Trigger play limit refresh
          if (onScoreSaved) {
            onScoreSaved()
          }
        } else {
          // Handle safety check rejections
          if (response.status === 403) {
            if (result.action === 'rejected_disabled') {
              // Game is disabled - score not saved
            } else if (result.action === 'rejected_limit') {
              // Play limit reached - score not saved
            }
          } else if (response.status === 409) {
            // Score not better than existing - not saved
          } else {
            // Other error
          }
        }
      }
    } catch (error) {
      throw error
    }
  }, [user, score, currentQuestion, totalTimeRef, onScoreSaved])

  return { saveScore }
}

// Reusable components
const GameHeader = ({ user, timeLeft, score, currentQuestion }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4">
    <div className="text-center space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          {GAME_CONFIG.title}
        </h1>
        <p className="text-white/80">
          Welcome, {user?.user_metadata?.username || user?.email?.split('@')[0] || 'Player'}!
        </p>
      </div>
      
      {/* Timer, Score, and Question - Horizontal Layout */}
      <div className="flex flex-wrap gap-3 md:gap-4 justify-center items-center">
        <div className="bg-red-500/20 text-red-300 px-4 py-2 rounded-full font-semibold text-sm md:text-base border border-red-500/30">
          ⏰ {formatTime(timeLeft)}
        </div>
        <div className="bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full font-semibold text-sm md:text-base border border-blue-500/30">
          🏆 Score: {score}
        </div>
        <div className="bg-green-500/20 text-green-300 px-4 py-2 rounded-full font-semibold text-sm md:text-base border border-green-500/30">
          📝 Q {currentQuestion}/{GAME_CONFIG.totalQuestions}
        </div>
      </div>
    </div>
  </div>
)

const ImageQuestion = ({ shuffledImages, selectedImage, onImageSelect }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {shuffledImages.map((image) => (
        <div
          key={image.id}
          className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 transform hover:scale-105 ${
            selectedImage === image.id
              ? 'border-purple-500 ring-4 ring-purple-300/50 shadow-lg'
              : 'border-white/20 hover:border-white/40 hover:shadow-md'
          }`}
          onClick={() => onImageSelect(image.id)}
        >
          <img
            src={image.src}
            alt={image.alt}
            className="w-full h-24 md:h-32 object-cover"
          />
          {selectedImage === image.id && (
            <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-lg">
              ✓
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)

const OptionQuestion = ({ options, selectedValue, onSelect, type }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {options.map((option) => (
        <Button
          key={option.value}
          onClick={() => onSelect(option.value)}
          className={`h-16 text-base font-semibold transition-all duration-300 transform hover:scale-105 ${
            selectedValue === option.value 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'bg-white/10 text-white/90 hover:bg-white/20 border border-white/20 hover:border-white/40'
          }`}
        >
          {option.label}
        </Button>
      ))}
    </div>
  </div>
)

const ResultDisplay = ({ gameState, currentQuestion, onContinue }) => {
  if (gameState === 'neutral') {
    return (
      <div className="text-center space-y-4">
        <div className="bg-blue-100 text-blue-800 p-4 rounded-lg">
          <h3 className="font-bold text-lg">Answer Submitted!</h3>
          <p>Click Next Question to continue.</p>
        </div>
        <Button onClick={onContinue} className="w-full text-lg py-3">
          {currentQuestion < GAME_CONFIG.totalQuestions ? 'Next Question' : 'Finish Game'}
        </Button>
      </div>
    )
  }
  return null
}

const GameOverScreen = ({ title, subtitle, score, buttonText, onButtonClick, bgColor = 'blue' }) => (
  <div className="text-center space-y-8">
    <div className="space-y-4">
      <h1 className="text-4xl font-bold text-white">{title}</h1>
      <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-3">Final Score: {score}</h2>
        <p className="text-lg text-white/80">{subtitle}</p>
      </div>
    </div>
    <Button 
      onClick={onButtonClick} 
      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
    >
      {buttonText}
    </Button>
  </div>
)

const StartScreen = ({ user, onStart }) => (
  <div className="text-center space-y-8">
    <div className="space-y-4">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        {GAME_CONFIG.title}
      </h1>
      <p className="text-xl text-white/80">
        {GAME_CONFIG.welcomeMessage.replace('{username}', user?.user_metadata?.username || user?.email?.split('@')[0] || 'Player')}
      </p>
    </div>
    
    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 max-w-xl mx-auto">
      <h3 className="font-semibold text-white text-lg mb-4">🎮 How to Play</h3>
      <div className="grid grid-cols-1 gap-3 text-left">
        <div className="flex items-center space-x-3 text-white/90">
          <span className="text-purple-400 text-xl">📝</span>
          <span>Answer {GAME_CONFIG.totalQuestions} questions about Ganesha idols</span>
        </div>
        <div className="flex items-center space-x-3 text-white/90">
          <span className="text-purple-400 text-xl">⏱️</span>
          <span>{GAME_CONFIG.timeLimit} seconds time limit per question</span>
        </div>
        <div className="flex items-center space-x-3 text-white/90">
          <span className="text-purple-400 text-xl">🏆</span>
          <span>{GAME_CONFIG.pointsPerQuestion} points per correct answer</span>
        </div>
        <div className="flex items-center space-x-3 text-white/90">
          <span className="text-purple-400 text-xl">⚡</span>
          <span>Try to get the highest score!</span>
        </div>
      </div>
    </div>
    
    <Button 
      onClick={onStart} 
      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
    >
      🚀 Start Game
    </Button>
  </div>
)

const QuestionRenderer = ({ currentQuestion, selectedImage, selectedHeight, selectedPrice, shuffledImages, onImageSelect, onHeightSelect, onPriceSelect }) => {
  const questionConfig = QUESTION_CONFIG[currentQuestion]

  switch (questionConfig.type) {
    case 'image':
      return (
        <ImageQuestion
          shuffledImages={shuffledImages}
          selectedImage={selectedImage}
          onImageSelect={onImageSelect}
        />
      )
    case 'height':
      return (
        <OptionQuestion
          options={GAME_OPTIONS.heights}
          selectedValue={selectedHeight}
          onSelect={onHeightSelect}
          type="height"
        />
      )
    case 'price':
      return (
        <OptionQuestion
          options={GAME_OPTIONS.prices}
          selectedValue={selectedPrice}
          onSelect={onPriceSelect}
          type="price"
        />
      )
    default:
      return null
  }
}

// Utility functions
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function GuessGame({ user, onScoreSaved = () => {} }) {
  const {
    currentQuestion,
    selectedImage,
    selectedHeight,
    selectedPrice,
    score,
    gameState,
    timeLeft,
    shuffledImages,
    hasSaved,
    totalTimeRef,
    canProceed,
    playLimitExceeded,
    setSelectedImage,
    setSelectedHeight,
    setSelectedPrice,
    setGameState,
    setTimeLeft,
    setHasSaved,
    resetGame,
    startGame,
    nextQuestion,
    checkAnswer,
    handleContinue
  } = useGameState(user)

  const { saveScore } = useScoreSaver(user, score, currentQuestion, totalTimeRef, onScoreSaved)

  // Timer effect
  useTimer(timeLeft, gameState, setTimeLeft)

  // Initialize game on mount
  useEffect(() => {
    resetGame()
  }, [resetGame])

  // Handle time up - automatically move to next question instead of ending game
  useEffect(() => {
    if (timeLeft === 0 && gameState === 'playing') {
      // Calculate time taken for this question when time runs out
      if (questionStartTimeRef.current) {
        const questionEndTime = Date.now()
        const timeTakenForQuestion = Math.floor((questionEndTime - questionStartTimeRef.current) / 1000)
        questionTimesRef.current.push(timeTakenForQuestion)
      }
      
      // Auto-advance to next question when time runs out
      if (currentQuestion < GAME_CONFIG.totalQuestions) {
        nextQuestion()
      } else {
        // Only end game if this was the last question
        // Calculate total time from all questions
        const totalTime = questionTimesRef.current.reduce((sum, time) => sum + time, 0)
        totalTimeRef.current = totalTime
        setGameState('completed')
      }
    }
  }, [timeLeft, gameState, setGameState, currentQuestion, nextQuestion])

  // Save score when game is completed (prevent multiple saves)
  useEffect(() => {
    if (gameState === 'completed' && !hasSaved) {
      setHasSaved(true)
      saveScore().catch(console.error)
    }
  }, [gameState, saveScore, hasSaved, setHasSaved])

  // Start screen
  if (gameState === 'ready') {
    return <StartScreen user={user} onStart={startGame} />
  }

  // Game over states
  if (gameState === 'completed') {
    return (
      <GameOverScreen
        title={GAME_CONFIG.gameCompleted.title}
        subtitle={GAME_CONFIG.gameCompleted.subtitle}
        score={score}
        buttonText={GAME_CONFIG.gameCompleted.buttonText}
        onButtonClick={resetGame}
        bgColor="green"
      />
    )
  }

  // Play limit exceeded state
  if (playLimitExceeded) {
    return (
      <GameOverScreen
        title="Play Limit Exceeded!"
        subtitle="You have reached your maximum allowed games for this game."
        score={score}
        buttonText="Play Again Tomorrow"
        onButtonClick={resetGame}
        bgColor="red"
      />
    )
  }


  const questionConfig = QUESTION_CONFIG[currentQuestion]

  return (
    <div className="space-y-6">
      <GameHeader 
        user={user} 
        timeLeft={timeLeft} 
        score={score} 
        currentQuestion={currentQuestion} 
      />

      {/* Game Section */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-white">
              {questionConfig.title}
            </h2>
            <p className="text-white/80 text-base">
              {questionConfig.description}
            </p>
          </div>
          
          <QuestionRenderer
            currentQuestion={currentQuestion}
            selectedImage={selectedImage}
            selectedHeight={selectedHeight}
            selectedPrice={selectedPrice}
            shuffledImages={shuffledImages}
            onImageSelect={setSelectedImage}
            onHeightSelect={setSelectedHeight}
            onPriceSelect={setSelectedPrice}
          />

          {/* Action Buttons */}
          {gameState === 'playing' && (
            <div className="flex justify-center">
              <Button 
                onClick={checkAnswer} 
                disabled={!canProceed}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Submit Answer
              </Button>
            </div>
          )}

          {/* Result Display */}
          <ResultDisplay 
            gameState={gameState} 
            currentQuestion={currentQuestion} 
            onContinue={handleContinue} 
          />
        </div>
      </div>

      {/* Game info */}
      <div className="text-center">
        <p className="text-white/60">Complete all questions to see your final score!</p>
      </div>
    </div>
  )
}