import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'gold' | 'ghost' | 'danger';

const variantClass: Record<ButtonVariant, string> = {
  primary: 'vt-button-primary',
  gold: 'vt-button-gold',
  ghost: 'vt-button-ghost',
  danger: 'vt-button-danger',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
}

export function Button({ children, className = '', variant = 'primary', ...props }: ButtonProps) {
  return (
    <button className={`vt-button ${variantClass[variant]} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  href: string;
  variant?: ButtonVariant;
}

export function ButtonLink({ children, className = '', href, variant = 'primary', ...props }: ButtonLinkProps) {
  return (
    <Link href={href} className={`vt-button ${variantClass[variant]} ${className}`.trim()} {...props}>
      {children}
    </Link>
  );
}
