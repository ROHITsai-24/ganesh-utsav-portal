import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const PlayLimitCard = ({ gameTitle, gameDescription, playCount, playLimit }) => {
  // Fix the count display - show actual attempts played, not including current attempt
  const actualPlayCount = Math.min(playCount, playLimit)
  
  return (
    <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <span>🎮 {gameTitle}</span>
          <span className="text-red-400">🚫</span>
        </CardTitle>
        <CardDescription className="text-white/80">{gameDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-4">
          <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-red-300 mb-2">
              Play Limit Reached
            </h3>
            <p className="text-red-200">
              You have played this game {actualPlayCount} time{actualPlayCount !== 1 ? 's' : ''} out of {playLimit} allowed.
            </p>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4 backdrop-blur-sm">
            <h4 className="font-medium text-blue-300 mb-2">Play Limit Info</h4>
            <p className="text-blue-200 text-sm">
              The admin has set a limit of {playLimit} play{playLimit !== 1 ? 's' : ''} for this game. 
              You can try other games or contact the admin if you need more plays.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PlayLimitCard
