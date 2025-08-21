import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    // Get admin email from headers
    const adminEmail = request.headers.get('x-admin-email')
    
    if (!adminEmail) {
      return NextResponse.json({ error: 'Admin email required' }, { status: 400 })
    }

    // Verify admin email matches environment variable
    const expectedAdminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL
    if (adminEmail !== expectedAdminEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get update data from request body
    const { title, message } = await request.json()
    
    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Insert new update
    const { data, error } = await supabase
      .from('updates')
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
      return NextResponse.json({ error: 'Failed to create update' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      update: data,
      message: 'Update created successfully'
    })

  } catch (error) {
    console.error('Create update error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    // Get admin email from headers
    const adminEmail = request.headers.get('x-admin-email')
    
    if (!adminEmail) {
      return NextResponse.json({ error: 'Admin email required' }, { status: 400 })
    }

    // Verify admin email matches environment variable
    const expectedAdminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL
    if (adminEmail !== expectedAdminEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get update ID from request body
    const { id } = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: 'Update ID required' }, { status: 400 })
    }

    // Delete the update
    const { error } = await supabase
      .from('updates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database delete error:', error)
      return NextResponse.json({ error: 'Failed to delete update' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Update deleted successfully'
    })

  } catch (error) {
    console.error('Delete update error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
