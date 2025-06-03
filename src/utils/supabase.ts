import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  reading_level?: number
  writing_level?: number
  subscription_status: 'free' | 'premium'
  subscription_expires_at?: string
  created_at: string
  updated_at: string
  monthly_worksheets_generated?: number
  last_generation_month?: number
  last_generation_year?: number
}

export interface WorksheetHistory {
  id: string
  user_id: string
  title: string
  topics: string[]
  activities: string[]
  worksheet_count: number
  pdf_url?: string
  created_at: string
}

// Auth Helper Functions
export const signUp = async (email: string, password: string, fullName?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  console.log('🔐 Starting signIn for:', email)
  
  try {
    const authPromise = supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    console.log('🔐 Auth request sent, waiting for response...')
    
    // Add 10 second timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Login timeout after 10 seconds')), 10000)
    )
    
    const { data, error } = await Promise.race([authPromise, timeoutPromise])
    
    console.log('🔐 Auth response received:', { data: !!data, error: error?.message })
    
    return { data, error }
  } catch (err) {
    console.error('🔐 Auth error:', err)
    return { data: null, error: { message: String(err) } }
  }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return { data, error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Profile Functions
export const createUserProfile = async (userId: string, profileData: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      ...profileData,
      subscription_status: 'free',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .single()
  
  return { data, error }
}

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  return { data, error }
}

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .single()
  
  return { data, error }
}

// Worksheet History Functions
export const saveWorksheetHistory = async (historyData: Omit<WorksheetHistory, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('worksheet_history')
    .insert({
      ...historyData,
      created_at: new Date().toISOString(),
    })
    .single()
  
  return { data, error }
}

export const getUserWorksheetHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('worksheet_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

// Subscription Helper Functions
export const checkUserSubscription = async (userId: string) => {
  try {
    console.log('🔍 Checking subscription status for user:', userId)
    
    const { data, error } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('❌ Error checking subscription:', error.message || error)
      return 'free' // Default to free on error
    }
    
    if (!data) {
      console.log('⚠️ No user data found, defaulting to free subscription')
      return 'free'
    }
    
    console.log('✅ User subscription status:', data.subscription_status || 'free')
    return data.subscription_status || 'free'
  } catch (error) {
    console.error('❌ Exception in checkUserSubscription:', error)
    return 'free'
  }
}

export const isPremiumUser = async (userId: string): Promise<boolean> => {
  try {
    const status = await checkUserSubscription(userId)
    return status === 'premium'
  } catch (error) {
    console.error('Error checking premium status:', error)
    return false
  }
}

export const canDownloadPDF = async (userId: string): Promise<boolean> => {
  try {
    return await isPremiumUser(userId)
  } catch (error) {
    console.error('Error checking PDF download permission:', error)
    return false
  }
}

// Monthly Worksheet Generation Tracking
export const checkMonthlyUsage = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('monthly_worksheets_generated, last_generation_month, last_generation_year')
      .eq('id', userId)
      .maybeSingle()
      
    if (error) {
      console.error('Error checking monthly usage:', error.message || error)
      return { monthlyGenerated: 0, lastMonth: null, lastYear: null }
    }
    
    // If user doesn't exist in users table, create them
    if (!data) {
      console.log('User not found in users table, creating user record...')
      
      // Get user email from Auth
      const { data: authUser } = await supabase.auth.getUser()
      const userEmail = authUser?.user?.email || 'unknown@example.com'
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userEmail,
          subscription_status: 'free',
          monthly_worksheets_generated: 0,
          last_generation_month: null,
          last_generation_year: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (insertError) {
        console.error('Failed to create user record:', insertError.message)
      } else {
        console.log('Successfully created user record with email:', userEmail)
      }
      
      return { monthlyGenerated: 0, lastMonth: null, lastYear: null }
    }
    
    return {
      monthlyGenerated: data.monthly_worksheets_generated || 0,
      lastMonth: data.last_generation_month,
      lastYear: data.last_generation_year
    }
  } catch (error) {
    console.error('Exception in checkMonthlyUsage:', error)
    return { monthlyGenerated: 0, lastMonth: null, lastYear: null }
  }
}

export const incrementMonthlyUsage = async (userId: string, incrementBy: number = 1) => {
  try {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()
    
    const { data, error } = await supabase
      .from('users')
      .select('monthly_worksheets_generated, last_generation_month, last_generation_year')
      .eq('id', userId)
      .maybeSingle()
    
    if (error) {
      console.log('Could not fetch user data for increment:', error.message)
      return false
    }
    
    let newCount = incrementBy
    
    // If it's the same month, add to existing count
    if (data?.last_generation_month === currentMonth && data?.last_generation_year === currentYear) {
      newCount = (data.monthly_worksheets_generated || 0) + incrementBy
    }
    
    // Update the usage data
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        monthly_worksheets_generated: newCount,
        last_generation_month: currentMonth,
        last_generation_year: currentYear,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
    
    if (updateError) {
      console.log('Could not update monthly usage:', updateError.message)
      return false
    }
    
    console.log(`Successfully updated monthly usage to ${newCount} for user ${userId}`)
    return true
  } catch (error) {
    console.error('Exception in incrementMonthlyUsage:', error)
    return false
  }
}

export const canGenerateWorksheets = async (userId: string, requestedCount: number = 1): Promise<{ canGenerate: boolean, currentCount: number, remainingCount: number }> => {
  try {
    // Check if user is premium first
    const isPremium = await isPremiumUser(userId)
    if (isPremium) {
      return { canGenerate: true, currentCount: 0, remainingCount: -1 } // -1 means unlimited
    }
    
    // Check monthly usage for free users
    const { monthlyGenerated, lastMonth, lastYear } = await checkMonthlyUsage(userId)
    const remainingCount = Math.max(0, 5 - monthlyGenerated)
    const canGenerateRequested = monthlyGenerated + requestedCount <= 5
    
    return { 
      canGenerate: canGenerateRequested, 
      currentCount: monthlyGenerated, 
      remainingCount 
    }
  } catch (error) {
    console.error('Exception in canGenerateWorksheets:', error)
    // Default to allowing generation for free users if there's an error
    return { canGenerate: true, currentCount: 0, remainingCount: 5 }
  }
}
