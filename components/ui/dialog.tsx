"use client"
import * as React from 'react'
export function Dialog({ open, onOpenChange, children }: { open: boolean, onOpenChange: (v:boolean)=>void, children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={()=>onOpenChange(false)}>
      <div className="bg-white rounded-2xl p-4 w-full max-w-lg" onClick={e=>e.stopPropagation()}>{children}</div>
    </div>
  )
}
export function DialogTrigger({ onClick, children }: { onClick: ()=>void, children: React.ReactNode }) { return <span onClick={onClick}>{children}</span> }
export function DialogHeader({ children }: { children: React.ReactNode }) { return <div className="text-xl font-semibold mb-2">{children}</div> }
export function DialogFooter({ children }: { children: React.ReactNode }) { return <div className="mt-4 flex gap-2 justify-end">{children}</div> }
