'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, getUserProfile, UserProfile } from '@/utils/supabase'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper function to create user record if it doesn't exist
const ensureUserRecord = async (user: User): Promise<UserProfile | null> => {
  try {
    console.log('🔍 Checking/creating user record for:', user.email)
    
    // First try to get existing profile
    console.log('🔍 Attempting to fetch existing profile...')
    const { data: existingProfile, error: profileError } = await getUserProfile(user.id)
    
    if (profileError) {
      console.error('❌ Error fetching profile:', profileError)
    }
    
    if (existingProfile) {
      console.log('✅ User record exists:', existingProfile.email, 'Subscription:', existingProfile.subscription_status)
      return existingProfile
    }
    
    // User record doesn't exist, create it via API
    console.log('🔄 User record not found, creating via API...')
    console.log('🔄 API URL will be:', '/api/create-user-safe')
    
    const response = await fetch('/api/create-user-safe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      }),
    })
    
    console.log('🔍 API Response status:', response.status, response.statusText)
    
    if (!response.ok) {
      console.error('❌ Failed to create user record via API')
      const errorText = await response.text()
      console.error('❌ API Error response:', errorText)
      return null
    }
    
    const result = await response.json()
    console.log('✅ User record creation result:', result)
    
    // Now fetch the created profile
    console.log('🔄 Fetching newly created profile...')
    const { data: newProfile, error: newProfileError } = await getUserProfile(user.id)
    
    if (newProfileError) {
      console.error('❌ Error fetching newly created profile:', newProfileError)
      return null
    }
    
    if (newProfile) {
      console.log('✅ Successfully fetched newly created profile:', newProfile.email)
      return newProfile
    } else {
      console.error('❌ Newly created profile not found')
      return null
    }
    
  } catch (error) {
    console.error('❌ Error ensuring user record:', error)
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Set a timeout to prevent infinite loading (increased for production)
    const loadingTimeout = setTimeout(() => {
      console.warn('⚠️ Auth loading timeout after 30 seconds - setting loading to false')
      console.warn('⚠️ Current state - User:', !!user, 'Profile:', !!profile)
      setLoading(false)
    }, 30000) // 30 second timeout (increased from 10)

    const getSession = async () => {
      console.log('🔄 Getting session...')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          console.log('👤 Session user:', session.user.email)
          setUser(session.user)
          
          // Ensure user record exists and get profile
          console.log('🔄 Ensuring user record exists...')
          const profileData = await ensureUserRecord(session.user)
          if (profileData) {
            console.log('✅ Profile loaded successfully:', profileData.email)
            setProfile(profileData)
          } else {
            console.error('❌ Failed to load or create profile')
            setProfile(null)
          }
        } else {
          console.log('👤 No session found')
        }
      } catch (error) {
        console.error('❌ Error getting session:', error)
      } finally {
        clearTimeout(loadingTimeout)
        setLoading(false)
        console.log('✅ Auth initialization complete')
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.email)
      if (session?.user) {
        setUser(session.user)
        
        // Ensure user record exists and get profile
        console.log('🔄 Auth state change - ensuring user record exists...')
        const profileData = await ensureUserRecord(session.user)
        if (profileData) {
          console.log('✅ Profile loaded from auth change:', profileData.email)
          setProfile(profileData)
        } else {
          console.error('❌ Failed to load or create profile from auth change')
          setProfile(null)
        }
      } else {
        console.log('👤 Auth state change - no user')
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
      clearTimeout(loadingTimeout)
    }
  }, [])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setProfile(null)
    }
  }

  const handleRefreshProfile = async () => {
    console.log('🔄 Refreshing user profile...')
    if (user) {
      try {
        // Ensure user record exists and get fresh profile
        const profileData = await ensureUserRecord(user)
        if (profileData) {
          console.log('✅ Profile refreshed:', profileData)
          setProfile(profileData)
        } else {
          console.error('❌ Failed to refresh profile')
        }
      } catch (error) {
        console.error('❌ Exception refreshing profile:', error)
      }
    }
  }

  const value = {
    user,
    profile,
    loading,
    signOut,
    refreshProfile: handleRefreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
