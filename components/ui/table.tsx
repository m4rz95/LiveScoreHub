import React from "react"

// Base interface biar bisa ditambah className & style
interface BaseProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

type TableProps = React.TableHTMLAttributes<HTMLTableElement> & BaseProps
type TheadProps = React.HTMLAttributes<HTMLTableSectionElement> & BaseProps
type TbodyProps = React.HTMLAttributes<HTMLTableSectionElement> & BaseProps
type TrProps = React.HTMLAttributes<HTMLTableRowElement> & BaseProps
type ThProps = React.ThHTMLAttributes<HTMLTableCellElement> & BaseProps
type TdProps = React.TdHTMLAttributes<HTMLTableCellElement> & BaseProps

export function Table({ children, className = "", style = {}, ...props }: TableProps) {
  return (
    <table {...props} className={`w-full rounded-lg ${className}`} style={style}>
      {children}
    </table>
  )
}

export function THead({ children, className = "", ...props }: TheadProps) {
  return (
    <thead {...props} className={`bg-white/50 backdrop-blur-sm ${className}`}>
      {children}
    </thead>
  )
}

export function TBody({ children, className = "", ...props }: TbodyProps) {
  return (
    <tbody {...props} className={`text-center bg-white/50 backdrop-blur-sm ${className}`}>
      {children}
    </tbody>
  )
}

export function TR({ children, className = "", ...props }: TrProps) {
  return (
    <tr {...props} className={`border-b-4 last:border-0 text-center ${className}`}>
      {children}
    </tr>
  )
}

export function TH({ children, className = "", ...props }: ThProps) {
  return (
    <th {...props} className={`px-3 py-2 text-sm text-gray-600 text-center ${className}`}>
      {children}
    </th>
  )
}

export function TD({ children, className = "", ...props }: TdProps) {
  return (
    <td {...props} className={`text-center bg-white/5 backdrop-blur-sm ${className}`}>
      {children}
    </td>
  )
}
