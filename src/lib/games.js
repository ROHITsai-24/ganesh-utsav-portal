import { supabase } from '@/lib/supabase'

const cache = new Map()

export async function getGameIdByKey(gameKey) {
  if (cache.has(gameKey)) return cache.get(gameKey)
  const { data, error } = await supabase
    .from('games')
    .select('id,key')
    .eq('key', gameKey)
    .single()
  if (error) return null
  cache.set(gameKey, data.id)
  return data.id
}


