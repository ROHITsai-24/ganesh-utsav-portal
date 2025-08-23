'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const GAME_CONFIG = {
  puzzle: {
    title: 'Puzzle Game',
    description: 'Sliding puzzle game with Ganesha idols'
  },
  guess: {
    title: 'Guess Game',
    description: 'Guess the correct Ganesha idol details'
  }
}

const useGameSettingsManager = () => {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState({})

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      const email = session?.user?.email || ''

      const response = await fetch('/api/admin/game-settings', {
        headers: {
          'x-admin-email': email
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load game settings')
      }

      const data = await response.json()
      setSettings(data.settings || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSetting = useCallback(async (gameKey, isEnabled, playLimit) => {
    // Optimistic update for better UX
    setSettings(prev => 
      prev.map(setting => 
        setting.game_key === gameKey 
          ? { ...setting, is_enabled: isEnabled, play_limit: playLimit || setting.play_limit }
          : setting
      )
    )

    try {
      setUpdating(prev => ({ ...prev, [gameKey]: true }))
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      const email = session?.user?.email || ''

      const response = await fetch('/api/admin/game-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': email
        },
        body: JSON.stringify({ gameKey, isEnabled, playLimit })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update setting')
      }
    } catch (err) {
      // Revert optimistic update on error
      setSettings(prev => 
        prev.map(setting => 
          setting.game_key === gameKey 
            ? { ...setting, is_enabled: !isEnabled }
            : setting
        )
      )
      setError(err.message)
    } finally {
      setUpdating(prev => ({ ...prev, [gameKey]: false }))
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return {
    settings,
    loading,
    error,
    updating,
    updateSetting,
    reloadSettings: loadSettings
  }
}

const GameSettingsManager = () => {
  const { settings, loading, error, updating, updateSetting } = useGameSettingsManager()

  // Memoize the settings list to prevent unnecessary re-renders
  const settingsList = useMemo(() => {
    return settings.map((setting) => {
      const gameConfig = GAME_CONFIG[setting.game_key]
      const isUpdating = updating[setting.game_key]
      
      return {
        ...setting,
        gameConfig,
        isUpdating
      }
    })
  }, [settings, updating])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Game Settings</CardTitle>
          <CardDescription>Control which games are available to users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game Settings</CardTitle>
        <CardDescription>Control which games are available to users</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          {settingsList.map((setting) => (
            <div key={setting.game_key} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{setting.gameConfig?.title || setting.game_key}</h3>
                <p className="text-gray-600 text-sm">{setting.gameConfig?.description}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    setting.is_enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {setting.is_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Play Limit: {setting.play_limit || 1}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Play Limit Input */}
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`play-limit-${setting.game_key}`} className="text-sm font-medium">
                    Play Limit:
                  </Label>
                  <input
                    id={`play-limit-${setting.game_key}`}
                    type="number"
                    min="1"
                    max="100"
                    value={setting.play_limit || 1}
                    onChange={(e) => {
                      const newLimit = parseInt(e.target.value) || 1
                      updateSetting(setting.game_key, setting.is_enabled, newLimit)
                    }}
                    disabled={setting.isUpdating}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Enable/Disable Switch */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`switch-${setting.game_key}`}
                    checked={setting.is_enabled}
                    onCheckedChange={(checked) => updateSetting(setting.game_key, checked, setting.play_limit)}
                    disabled={setting.isUpdating}
                  />
                  <Label htmlFor={`switch-${setting.game_key}`}>
                    {setting.isUpdating ? 'Updating...' : (setting.is_enabled ? 'Enabled' : 'Disabled')}
                  </Label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default GameSettingsManager
