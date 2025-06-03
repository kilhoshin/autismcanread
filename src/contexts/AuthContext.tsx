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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.warn('⚠️ Auth loading timeout - setting loading to false')
      setLoading(false)
    }, 5000) // 5 second timeout

    const getSession = async () => {
      console.log('🔄 Getting session...')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          console.log('👤 Session user:', session.user.email)
          setUser(session.user)
          const { data: profileData } = await getUserProfile(session.user.id)
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
        const { data: profileData } = await getUserProfile(session.user.id)
        setProfile(profileData)
      } else {
        setUser(null)
        setProfile(null)
      }
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
        const { data: profileData, error } = await getUserProfile(user.id)
        if (error) {
          console.error('❌ Error refreshing profile:', error)
        } else {
          console.log('✅ Profile refreshed:', profileData)
          setProfile(profileData)
          
          // Force a re-render by updating a timestamp
          setProfile(prev => ({ ...profileData, _refreshed: Date.now() }))
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
