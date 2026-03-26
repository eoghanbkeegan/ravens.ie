export type Role = 'admin' | 'member'

export type Category = 'overall' | 'ladies' | 'c2' | 'c3'

export type PrizeType = 'cash' | 'voucher'

export interface Member {
  id: string
  email: string
  name: string
  role: Role
}

export interface Race {
  id: string
  round: number
  date: string
  time: string
  isParaCycling?: boolean
}

export interface Result {
  id: string
  raceId: string
  memberId: string
  category: Category
  position: number
  prizeType: PrizeType
  prizeAmount?: number
  voucherSponsor?: string
  notificationSent: boolean
}

export interface Order {
  id: string
  memberId: string
  items: string[]
  status: 'pending' | 'confirmed' | 'shipped'
  createdAt: string
}