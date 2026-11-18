'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton({ children, className = 'capsule fill block', pendingText, disabled, ...rest }: { children: React.ReactNode; className?: string; pendingText?: string; disabled?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={className} disabled={pending || disabled} aria-busy={pending} {...rest}>
      {pending && pendingText ? pendingText : children}
    </button>
  )
}
