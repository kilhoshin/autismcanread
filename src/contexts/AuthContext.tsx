'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, getUserProfile, UserProfile } from '@/utils/supabase'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
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
    // Get initial session
    const getSession = async () => {
      console.log('🔄 Getting session...')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('👤 Session user:', session?.user?.email)
        setUser(session?.user ?? null)
        
        // Temporarily disable profile lookup to avoid RLS issues
        // if (session?.user) {
        //   const { data: profileData } = await getUserProfile(session.user.id)
        //   setProfile(profileData)
        // }
      } catch (error) {
        console.error('Error getting session:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.warn('⚠️ Auth loading timeout - setting loading to false')
      setLoading(false)
    }, 5000) // 5 second timeout

    getSession().then(() => {
      clearTimeout(loadingTimeout)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email)
        setUser(session?.user ?? null)
        
        // Temporarily disable profile lookup to avoid RLS issues
        // if (session?.user) {
        //   const { data: profileData } = await getUserProfile(session.user.id)
        //   setProfile(profileData)
        // } else {
        //   setProfile(null)
        // }
        
        // Don't set loading false here - only in initial getSession
      }
    )

    return () => {
      subscription.unsubscribe()
      clearTimeout(loadingTimeout)
    }
  }, [])

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setProfile(null)
    }
  }

  const value = {
    user,
    profile,
    loading,
    signOut: handleSignOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
