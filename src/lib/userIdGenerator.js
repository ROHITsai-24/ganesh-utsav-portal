import { createClient } from '@supabase/supabase-js'

// Configuration for user ID generation
const USER_ID_CONFIG = {
  min: 1000, // 4-digit minimum
  max: 9999, // 4-digit maximum
  maxAttempts: 50 // Prevent infinite loops
}

/**
 * Generates a unique 4-digit readable user ID
 * @returns {Promise<string>} Unique 4-digit ID as string
 */
export async function generateUniqueUserId() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase configuration missing')
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  
  // Get all existing user IDs from metadata
  const { data: usersList, error: usersErr } = await adminClient.auth.admin.listUsers()
  if (usersErr) {
    throw new Error(`Failed to fetch users: ${usersErr.message}`)
  }

  // Extract existing user IDs from metadata
  const existingIds = new Set()
  usersList.users.forEach(user => {
    const userId = user.user_metadata?.readable_id
    if (userId && /^\d{4}$/.test(userId)) {
      existingIds.add(userId)
    }
  })

  // Generate unique ID
  let attempts = 0
  let newId
  
  do {
    newId = Math.floor(Math.random() * (USER_ID_CONFIG.max - USER_ID_CONFIG.min + 1)) + USER_ID_CONFIG.min
    attempts++
    
    if (attempts > USER_ID_CONFIG.maxAttempts) {
      throw new Error('Unable to generate unique user ID after maximum attempts')
    }
  } while (existingIds.has(newId.toString()))

  return newId.toString()
}

/**
 * Validates if a user ID is in correct format
 * @param {string} userId - User ID to validate
 * @returns {boolean} True if valid 4-digit ID
 */
export function isValidUserId(userId) {
  return /^\d{4}$/.test(userId)
}

/**
 * Formats user ID for display
 * @param {string} userId - User ID to format
 * @returns {string} Formatted user ID (e.g., "#1234")
 */
export function formatUserId(userId) {
  if (!userId || !isValidUserId(userId)) {
    return null
  }
  return `#${userId}`
}
