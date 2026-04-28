// app/signup/page.tsx
import { Suspense } from 'react';
import SignupForm from './SignupForm';

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d0f14] flex items-center justify-center">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}