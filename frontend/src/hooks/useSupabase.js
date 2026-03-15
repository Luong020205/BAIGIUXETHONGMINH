import { useState, useCallback } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useToast } from '../context/ToastContext'

export const useSupabase = () => {
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const query = useCallback(async (operation, successMsg = null, errorMsg = 'Đã có lỗi xảy ra') => {
    setLoading(true)
    try {
      const { data, error } = await operation(supabase)
      if (error) throw error
      
      if (successMsg) {
        showToast(successMsg, 'success')
      }
      return { data, error: null }
    } catch (error) {
      console.error('Supabase error:', error)
      showToast(error.message || errorMsg, 'error')
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }, [showToast])

  return { loading, query }
}
