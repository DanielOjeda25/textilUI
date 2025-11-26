import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ReactNode }

export default function IconButton({ icon, children, ...props }: Props) {
  return <button {...props}>{icon}{children}</button>
}
