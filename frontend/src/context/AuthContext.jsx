import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { ROLES } from '../utils/constants'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const currentUserRef = React.useRef(null)
  const profileRef = React.useRef(null)

  console.log('AuthContext State:', { hasUser: !!user, hasProfile: !!profile, loading })

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      console.log('AuthContext: Initializing...')
      try {
        // First check for existing session
        const { data: { session } } = await supabase.auth.getSession()
        const initialUser = session?.user ?? null
        
        if (!mounted) return

        if (initialUser) {
          currentUserRef.current = initialUser
          setUser(initialUser)
          await fetchProfile(initialUser.id)
        } else {
          setLoading(false)
        }

        // Then listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('AuthContext: onAuthStateChange:', event, session?.user?.email)
          
          if (!mounted) return

          const newUser = session?.user ?? null
          
          if (event === 'SIGNED_OUT') {
            currentUserRef.current = null
            profileRef.current = null
            setUser(null)
            setProfile(null)
            setLoading(false)
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            // Only update and fetch if the user is different or profile is missing
            const isUserChanged = newUser?.id !== currentUserRef.current?.id
            
            if (isUserChanged) {
              currentUserRef.current = newUser
              setUser(newUser)
            }

            if (newUser && (isUserChanged || !profileRef.current)) {
              await fetchProfile(newUser.id)
            } else {
              setLoading(false)
            }
          }
        })

        return () => {
          mounted = false
          subscription.unsubscribe()
        }
      } catch (err) {
        console.error('AuthContext: Initialization error:', err)
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, [])

  const fetchProfile = async (userId, retries = 2) => {
    if (!userId) {
      setLoading(false)
      return
    }
    
    // Only show loading if we don't have a profile yet
    if (!profile) {
      setLoading(true)
    }
    console.log('AuthContext: fetchProfile starting for', userId, 'Retries left:', retries)
    
    for (let i = 0; i <= retries; i++) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) throw error
        
        profileRef.current = data
        setProfile(data)
        setLoading(false)
        return // Success!
      } catch (error) {
        console.error(`AuthContext: Attempt ${i + 1} failed:`, error.message)
        if (i === retries) {
          setProfile(null)
          setLoading(false)
        } else {
          // Wait a bit before retry
          await new Promise(res => setTimeout(res, 500 * (i + 1)))
        }
      }
    }
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  const register = async (email, password, fullName, phone) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
        },
      },
    })
    if (error) throw error
    return data
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const isAdmin = profile?.role === ROLES.ADMIN
  const isEmployee = profile?.role === ROLES.EMPLOYEE
  const isCustomer = profile?.role === ROLES.CUSTOMER

  const value = {
    user,
    profile,
    loading,
    login,
    register,
    logout,
    isAdmin,
    isEmployee,
    isCustomer,
    refreshProfile: () => fetchProfile(user?.id)
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => useContext(AuthContext)
