'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const DisabledGameCard = ({ gameTitle, gameDescription }) => {
  return (
    <Card className="relative overflow-hidden">
      {/* Disabled overlay */}
      <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm z-10 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Game Temporarily Unavailable</h3>
          <p className="text-gray-600 text-sm">This game is currently disabled by the administrator.</p>
        </div>
      </div>
      
      <CardHeader>
        <CardTitle className="text-gray-400">{gameTitle}</CardTitle>
        <CardDescription className="text-gray-400">{gameDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-sm">Game Disabled</span>
          </div>
          <Button disabled className="w-full bg-gray-300 text-gray-500 cursor-not-allowed">
            Game Unavailable
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default DisabledGameCard
