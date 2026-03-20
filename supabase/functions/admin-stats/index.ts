// Edge Function: admin-stats
// Deploy with: supabase functions deploy admin-stats
// This acts as a middleware between the app and the database
// providing aggregated admin statistics securely

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the requester is an admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch all stats using service role (bypasses RLS)
    const [usersRes, listingsRes, commentsRes, followsRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, wilaya, is_admin, is_verified, status, followers_count, total_qr_scans, created_at'),
      supabase.from('listings').select('id, user_id, category, listing_type, is_active, view_count, share_count, created_at'),
      supabase.from('comments').select('id'),
      supabase.from('follows').select('id'),
    ])

    const users = usersRes.data || []
    const listings = listingsRes.data || []

    const stats = {
      totalUsers: users.length,
      totalListings: listings.length,
      activeListings: listings.filter(l => l.is_active).length,
      carsCount: listings.filter(l => l.category === 'car').length,
      bikesCount: listings.filter(l => l.category === 'motorcycle').length,
      realEstateCount: listings.filter(l => l.category === 'real_estate').length,
      sellCount: listings.filter(l => l.listing_type === 'sell').length,
      buyCount: listings.filter(l => l.listing_type === 'buy').length,
      exchangeCount: listings.filter(l => l.listing_type === 'exchange').length,
      totalViews: listings.reduce((sum, l) => sum + (l.view_count || 0), 0),
      totalShares: listings.reduce((sum, l) => sum + (l.share_count || 0), 0),
      totalComments: (commentsRes.data || []).length,
      totalFollows: (followsRes.data || []).length,
      verifiedUsers: users.filter(u => u.is_verified).length,
      adminCount: users.filter(u => u.is_admin).length,
      bannedCount: users.filter(u => u.status === 'banned').length,
      users: users,
      recentListings: listings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10),
    }

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
