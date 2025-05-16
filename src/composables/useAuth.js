import { ref } from 'vue'
import { supabase } from '@/supabase'

export function useAuth() {
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  supabase.auth.onAuthStateChange((event, session) => {
    user.value = session?.user || null
  })

  const login = async (email, password) => {
    try {
      loading.value = true
      error.value = null
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (authError) throw authError
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const signUp = async (email, password) => {
    try {
      loading.value = true
      error.value = null
      const { error: authError } = await supabase.auth.signUp({
        email,
        password
      })
      if (authError) throw authError
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      loading.value = true
      error.value = null
      const { error: authError } = await supabase.auth.signOut()
      if (authError) throw authError
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    error,
    login,
    signUp,
    logout
  }
}