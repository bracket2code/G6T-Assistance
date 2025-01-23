import { supabase } from '../supabase'

export const getBusinesses = async () => {
  const { data, error } = await supabase
    .from('businesses') 
    .select('*')
    .eq('active', true)
    .order('name')

  if (error) throw error
  return data.map(business => ({
    id: business.id,
    name: business.name,
    legal_name: business.legal_name,
    address: business.address,
    email: business.email,
    tax_id: business.tax_id,
    notes: business.notes,
    active: business.active,
    created_at: business.created_at
  }))
}

export const createBusiness = async (businessData: any) => {
  const { data, error } = await supabase
    .from('businesses')
    .insert(businessData)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const updateBusiness = async (id: string, businessData: any) => {
  const { data, error } = await supabase
    .from('businesses')
    .update(businessData)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const deleteBusiness = async (id: string) => {
  const { error } = await supabase
    .from('businesses')
    .update({ active: false })
    .eq('id', id)

  if (error) throw error
}