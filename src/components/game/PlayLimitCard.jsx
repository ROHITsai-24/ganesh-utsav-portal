import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const PlayLimitCard = ({ gameTitle, gameDescription, playCount, playLimit }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🎮 {gameTitle}</span>
          <span className="text-red-500">🚫</span>
        </CardTitle>
        <CardDescription>{gameDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Play Limit Reached
            </h3>
            <p className="text-red-600">
              You have played this game {playCount} time{playCount !== 1 ? 's' : ''} out of {playLimit} allowed.
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Play Limit Info</h4>
            <p className="text-blue-600 text-sm">
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
