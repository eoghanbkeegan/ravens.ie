'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminKitPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/products')
  }, [router])
  return (
    <div className="p-8 text-ravens-muted">Redirecting to kit products...</div>
  )
}