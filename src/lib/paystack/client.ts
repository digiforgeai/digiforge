// lib/paystack/client.ts
import axios from 'axios'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

if (!PAYSTACK_SECRET_KEY) {
  console.warn('⚠️ PAYSTACK_SECRET_KEY is not set in environment variables')
}

export const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
})

// Helper to check if Paystack is configured
export const isPaystackConfigured = () => {
  return !!PAYSTACK_SECRET_KEY && PAYSTACK_SECRET_KEY !== 'sk_live_xxxxxxxxxxxxxxxx'
}