/**
 * Utility functions to clear browser storage and fix caching issues
 */

export const clearAllBrowserStorage = () => {
  console.log('🧹 Clearing all browser storage...')
  
  try {
    // Clear localStorage
    localStorage.clear()
    console.log('✅ localStorage cleared')
    
    // Clear sessionStorage
    sessionStorage.clear()
    console.log('✅ sessionStorage cleared')
    
    // Clear IndexedDB (Supabase storage)
    if (typeof window !== 'undefined' && window.indexedDB) {
      // Clear common Supabase IndexedDB entries
      const dbNames = ['supabase-auth-token', 'supabaseAuth']
      
      dbNames.forEach(dbName => {
        const deleteReq = indexedDB.deleteDatabase(dbName)
        deleteReq.onsuccess = () => {
          console.log(`✅ IndexedDB ${dbName} cleared`)
        }
        deleteReq.onerror = (e) => {
          console.log(`⚠️ Could not clear IndexedDB ${dbName}:`, e)
        }
      })
    }
    
    console.log('✅ All browser storage cleared successfully')
    return true
  } catch (error) {
    console.error('❌ Error clearing browser storage:', error)
    return false
  }
}

export const clearSupabaseAuth = () => {
  console.log('🔐 Clearing Supabase auth storage...')
  
  try {
    // Clear Supabase specific items from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key)
        console.log(`✅ Removed localStorage key: ${key}`)
      }
    })
    
    // Clear Supabase specific items from sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
        sessionStorage.removeItem(key)
        console.log(`✅ Removed sessionStorage key: ${key}`)
      }
    })
    
    console.log('✅ Supabase auth storage cleared successfully')
    return true
  } catch (error) {
    console.error('❌ Error clearing Supabase auth storage:', error)
    return false
  }
}

export const clearAuthAndReload = async () => {
  console.log('🔄 Clearing auth and reloading page...')
  
  try {
    // Clear browser storage
    clearAllBrowserStorage()
    
    // Clear server-side auth via API
    await fetch('/api/clear-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    // Wait a moment for cleanup to complete
    setTimeout(() => {
      console.log('🔄 Reloading page...')
      window.location.href = '/'
    }, 1000)
    
    return true
  } catch (error) {
    console.error('❌ Error during auth clear and reload:', error)
    // Still reload even if API call fails
    setTimeout(() => {
      window.location.href = '/'
    }, 1000)
    return false
  }
}
