import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { type Business } from '../types/attendance'

export function useBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([])

  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        let attempts = 3;
        let lastError = null;

        while (attempts > 0) {
          const { data, error: fetchError } = await supabase
            .from('businesses')
            .select('id, name')
            .eq('active', true)
            .order('name')
          
          if (!fetchError) {
            setBusinesses(data || []);
            return;
          }
          
          lastError = fetchError;
          attempts--;
          
          if (attempts > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        throw lastError;
      } catch (error) {
        console.error('Error loading businesses:', error);
        setBusinesses([]); // Set empty array as fallback
      }
    }
    
    loadBusinesses();
  }, [])

  return businesses
}