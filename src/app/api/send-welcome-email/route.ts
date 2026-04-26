// app/api/send-welcome-email/route.ts
import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email/service'

export async function POST(request: Request) {
  try {
    const { email, fullName } = await request.json()
    
    if (!email || !fullName) {
      return NextResponse.json({ error: 'Missing email or fullName' }, { status: 400 })
    }
    
    const result = await sendWelcomeEmail(email, fullName)
    
    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}