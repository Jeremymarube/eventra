'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

const Accordion = React.forwardRef(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('w-full', className)}
      {...props}
    >
      {children}
    </div>
  )
)
Accordion.displayName = 'Accordion'

const AccordionItem = React.forwardRef(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('border-b', className)}
      {...props}
    >
      {children}
    </div>
  )
)
AccordionItem.displayName = 'AccordionItem'

const AccordionTrigger = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
        data-state={isOpen ? 'open' : 'closed'}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </button>
    )
  }
)
AccordionTrigger.displayName = 'AccordionTrigger'

const AccordionContent = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    const [height, setHeight] = React.useState(0)
    const contentRef = React.useRef(null)

    React.useEffect(() => {
      if (contentRef.current) {
        setHeight(contentRef.current.scrollHeight)
      }
    }, [children])

    return (
      <div
        ref={ref}
        className={cn(
          'overflow-hidden text-sm transition-all',
          className
        )}
        style={{
          height: height ? `${height}px` : '0px',
        }}
        {...props}
      >
        <div ref={contentRef} className="pb-4 pt-0">
          {children}
        </div>
      </div>
    )
  }
)
AccordionContent.displayName = 'AccordionContent'

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
