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
    const { data: existingProfile } = await getUserProfile(user.id)
    
    if (existingProfile) {
      console.log('✅ User record exists:', existingProfile.email)
      return existingProfile
    }
    
    // User record doesn't exist, create it via API
    console.log('🔄 Creating user record via API...')
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
    
    if (!response.ok) {
      console.error('❌ Failed to create user record via API')
      return null
    }
    
    const result = await response.json()
    console.log('✅ User record creation result:', result)
    
    // Now fetch the created profile
    const { data: newProfile } = await getUserProfile(user.id)
    return newProfile
    
  } catch (error) {
    console.error('❌ Error ensuring user record:', error)
    return null
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.warn('⚠️ Auth loading timeout - setting loading to false')
      setLoading(false)
    }, 10000) // 10 second timeout (increased from 5)

    const getSession = async () => {
      console.log('🔄 Getting session...')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          console.log('👤 Session user:', session.user.email)
          setUser(session.user)
          
          // Ensure user record exists and get profile
          const profileData = await ensureUserRecord(session.user)
          setProfile(profileData)
        }
      } catch (error) {
        console.error('❌ Error getting session:', error)
      } finally {
        clearTimeout(loadingTimeout)
        setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.email)
      if (session?.user) {
        setUser(session.user)
        
        // Ensure user record exists and get profile
        const profileData = await ensureUserRecord(session.user)
        setProfile(profileData)
      } else {
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
