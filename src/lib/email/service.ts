// lib/email/service.ts
import { Resend } from 'resend';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { BillingEmail } from '@/emails/BillingEmail';

// Debug log
console.log('🔧 Email Service Initialized');
console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
console.log('RESEND_API_KEY value:', process.env.RESEND_API_KEY ? 'Set (starts with ' + process.env.RESEND_API_KEY.substring(0, 5) + '...)' : 'Missing');
console.log('NODE_ENV:', process.env.NODE_ENV);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'support@digiforgeai.app';

// Only initialize Resend if API key exists and is not a placeholder
const resend = (RESEND_API_KEY && RESEND_API_KEY !== 're_123' && RESEND_API_KEY.startsWith('re_')) 
  ? new Resend(RESEND_API_KEY) 
  : null;

if (!resend) {
  console.warn('⚠️ Resend not configured. Email sending disabled.');
}

export async function sendWelcomeEmail(to: string, name: string) {
  console.log('📧 Attempting to send welcome email to:', to);
  
  if (!resend) {
    console.warn('⚠️ Resend not configured. Skipping welcome email to:', to);
    return { success: false, error: 'Resend not configured', devMode: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: 'Welcome to DigiForgeAI! 🚀',
      react: WelcomeEmail({
        name,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
      }),
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error };
    }

    console.log('✅ Welcome email sent to:', to);
    return { success: true, data };
  } catch (error) {
    console.error('Welcome email error:', error);
    return { success: false, error };
  }
}

export async function sendBillingEmail(to: string, name: string, planName: string, amount: string) {
  console.log('📧 Attempting to send billing email to:', to);
  
  if (!resend) {
    console.warn('⚠️ Resend not configured. Skipping billing email to:', to);
    return { success: false, error: 'Resend not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: `Payment Confirmed - ${planName} Plan Active`,
      react: BillingEmail({
        name,
        planName,
        amount,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      }),
    });

    if (error) {
      console.error('Failed to send billing email:', error);
      return { success: false, error };
    }

    console.log('✅ Billing email sent to:', to);
    return { success: true, data };
  } catch (error) {
    console.error('Billing email error:', error);
    return { success: false, error };
  }
}