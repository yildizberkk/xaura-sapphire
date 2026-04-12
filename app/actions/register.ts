'use server'
import { supabaseAdmin } from '@/lib/supabase-server'

export interface RegistrationInput {
  firstName: string
  lastName:  string
  phone:     string
  email?:    string
  consent:   boolean
}

export async function registerUser(data: RegistrationInput): Promise<void> {
  const { error } = await supabaseAdmin.from('registrations').insert({
    first_name: data.firstName,
    last_name:  data.lastName,
    phone:      data.phone,
    email:      data.email || null,
    consent:    data.consent,
  })
  if (error) throw new Error(error.message)
}
