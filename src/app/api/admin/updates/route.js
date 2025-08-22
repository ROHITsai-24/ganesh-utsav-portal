import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configuration object for admin updates API
const ADMIN_UPDATES_CONFIG = {
  // Database table name
  table: 'updates',
  // Error messages
  errors: {
    adminEmailRequired: 'Admin email required',
    unauthorized: 'Unauthorized',
    messageRequired: 'Message is required',
    updateIdRequired: 'Update ID required',
    failedToCreate: 'Failed to create update',
    failedToDelete: 'Failed to delete update',
    internalError: 'Internal server error'
  },
  // Success messages
  success: {
    created: 'Update created successfully',
    deleted: 'Update deleted successfully'
  },
  // HTTP status codes
  status: {
    badRequest: 400,
    unauthorized: 403,
    internalError: 500
  }
}

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Helper function to verify admin authorization
const verifyAdminAuth = (request) => {
  const adminEmail = request.headers.get('x-admin-email')
  
  if (!adminEmail) {
    return { error: ADMIN_UPDATES_CONFIG.errors.adminEmailRequired, status: ADMIN_UPDATES_CONFIG.status.badRequest }
  }

  const expectedAdminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL
  if (adminEmail !== expectedAdminEmail) {
    return { error: ADMIN_UPDATES_CONFIG.errors.unauthorized, status: ADMIN_UPDATES_CONFIG.status.unauthorized }
  }

  return { adminEmail }
}

export async function POST(request) {
  try {
    // Verify admin authorization
    const authResult = verifyAdminAuth(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Get update data from request body
    const { title, message } = await request.json()
    
    if (!message || message.trim().length === 0) {
      return NextResponse.json({ 
        error: ADMIN_UPDATES_CONFIG.errors.messageRequired 
      }, { status: ADMIN_UPDATES_CONFIG.status.badRequest })
    }

    // Insert new update
    const { data, error } = await supabase
      .from(ADMIN_UPDATES_CONFIG.table)
      .insert([
        {
          title: title || null,
          message: message.trim()
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Database insert error:', error)
      return NextResponse.json({ 
        error: ADMIN_UPDATES_CONFIG.errors.failedToCreate 
      }, { status: ADMIN_UPDATES_CONFIG.status.internalError })
    }

    return NextResponse.json({ 
      success: true, 
      update: data,
      message: ADMIN_UPDATES_CONFIG.success.created
    })

  } catch (error) {
    console.error('Create update error:', error)
    return NextResponse.json({ 
      error: ADMIN_UPDATES_CONFIG.errors.internalError 
    }, { status: ADMIN_UPDATES_CONFIG.status.internalError })
  }
}

export async function DELETE(request) {
  try {
    // Verify admin authorization
    const authResult = verifyAdminAuth(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Get update ID from request body
    const { id } = await request.json()
    
    if (!id) {
      return NextResponse.json({ 
        error: ADMIN_UPDATES_CONFIG.errors.updateIdRequired 
      }, { status: ADMIN_UPDATES_CONFIG.status.badRequest })
    }

    // Delete the update
    const { error } = await supabase
      .from(ADMIN_UPDATES_CONFIG.table)
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database delete error:', error)
      return NextResponse.json({ 
        error: ADMIN_UPDATES_CONFIG.errors.failedToDelete 
      }, { status: ADMIN_UPDATES_CONFIG.status.internalError })
    }

    return NextResponse.json({ 
      success: true, 
      message: ADMIN_UPDATES_CONFIG.success.deleted
    })

  } catch (error) {
    console.error('Delete update error:', error)
    return NextResponse.json({ 
      error: ADMIN_UPDATES_CONFIG.errors.internalError 
    }, { status: ADMIN_UPDATES_CONFIG.status.internalError })
  }
}
