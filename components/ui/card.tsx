export function Card({ children, className='' }: { children: React.ReactNode, className?: string }) { return <div className={"p-4 bg-white/50 rounded-lg backdrop-blur-sm"+className}>{children}</div> }
export function CardHeader({ children, className='' }: { children: React.ReactNode, className?: string }) { return <div className={"mb-2 font-semibold text-lg" + className}>{children}</div> }
export function CardContent({
  children,
  className = '',
  style = {},
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={`mb-2 ${className}`} style={style}>
      {children}
    </div>
  )
}

