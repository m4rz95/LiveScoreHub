import * as React from 'react'
export function Button({ className='', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`px-4 py-2 rounded-lg border shadow-sm hover:shadow ${className}`} {...props} />
}
