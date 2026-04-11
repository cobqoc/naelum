import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'

// POST /api/recommendations/track - Track user interactions for personalization learning
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const { allowed } = await checkRateLimit(`track:${user.id}`, { windowMs: 60 * 1000, maxRequests: 30 })
  if (!allowed) {
    return NextResponse.json({ error: '요청이 너무 많습니다.' }, { status: 429 })
  }

  let body: { recipe_id?: string; recommendation_type?: string; action?: string; session_duration_seconds?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다' }, { status: 400 });
  }
  const {
    recipe_id,
    recommendation_type,
    action, // 'click' | 'save' | 'cook' | 'view' | 'dismiss'
    session_duration_seconds,
  } = body

  if (!recipe_id || !action) {
    return NextResponse.json({ error: 'recipe_id and action are required' }, { status: 400 })
  }

  // Determine interaction weight based on action
  const weightMap: Record<string, number> = {
    dismiss: -0.5,
    view: 0.1,
    click: 0.3,
    save: 0.7,
    cook: 1.0,
  }

  const interaction_weight = weightMap[action] ?? 0.1

  try {
    // Check if a record already exists for this user + recipe + type
    const { data: existing } = await supabase
      .from('recommendation_history')
      .select('id, was_clicked, was_saved, was_cooked, interaction_weight')
      .eq('user_id', user.id)
      .eq('recipe_id', recipe_id)
      .eq('recommendation_type', recommendation_type || 'personalized')
      .maybeSingle()

    if (existing) {
      // Update existing record
      const updates: Record<string, unknown> = {
        interaction_weight: Math.min(1.0, Math.max(-1.0,
          (existing.interaction_weight || 0) + interaction_weight * 0.3
        )),
      }

      if (action === 'click') updates.was_clicked = true
      if (action === 'save') updates.was_saved = true
      if (action === 'cook') updates.was_cooked = true
      if (session_duration_seconds) updates.session_duration_seconds = session_duration_seconds

      await supabase
        .from('recommendation_history')
        .update(updates)
        .eq('id', existing.id)
    } else {
      // Insert new record
      await supabase
        .from('recommendation_history')
        .insert({
          user_id: user.id,
          recipe_id,
          recommendation_type: recommendation_type || 'personalized',
          recommendation_score: interaction_weight,
          was_clicked: action === 'click' || action === 'save' || action === 'cook',
          was_saved: action === 'save',
          was_cooked: action === 'cook',
          interaction_weight,
          session_duration_seconds: session_duration_seconds || null,
        })
    }

    // Update user interests based on interactions
    if (action === 'cook' || action === 'save') {
      // Fetch the recipe's cuisine type
      const { data: recipe } = await supabase
        .from('recipes')
        .select('cuisine_type, dish_type')
        .eq('id', recipe_id)
        .single()

      if (recipe?.cuisine_type) {
        // Check if user already has this interest
        const { data: existingInterest } = await supabase
          .from('user_interests')
          .select('id')
          .eq('user_id', user.id)
          .eq('interest_type', 'cuisine')
          .eq('interest_value', recipe.cuisine_type)
          .maybeSingle()

        if (!existingInterest) {
          // Auto-add cuisine interest based on repeated interactions
          const { count } = await supabase
            .from('recommendation_history')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .in('recommendation_type', ['personalized', 'ingredients', 'trending'])
            .gte('interaction_weight', 0.5)

          // After 3+ positive interactions, auto-learn the preference
          if ((count || 0) >= 3) {
            await supabase
              .from('user_interests')
              .insert({
                user_id: user.id,
                interest_type: 'cuisine',
                interest_value: recipe.cuisine_type,
              })
              .select()
              .maybeSingle()
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Recommendation tracking error:', error)
    return NextResponse.json({ error: '추적에 실패했습니다' }, { status: 500 })
  }
}
