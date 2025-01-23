export type IdType = 'DNI' | 'NIE' | 'Pasaporte' | 'Otros'

export type Role = 'admin' | 'manager' | 'user'

export type Business = {
  id: string
  name: string
}

export interface User {
  id: string
  email: string
  password?: string
  name: string
  alias?: string
  lastName: string
  idType: IdType
  idNumber: string
  phone?: string
  address?: string
  birthDate: string
  role: Role
  businesses?: Business[]
}