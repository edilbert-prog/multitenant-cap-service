import { Toaster as Sonner } from "sonner"

const Toaster = () => {
  return (
    <Sonner
      position="top-right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:bg-green-500 group-[.toaster]:text-white",
          error: "group-[.toaster]:bg-red-500 group-[.toaster]:text-white",
          info: "group-[.toaster]:bg-blue-500 group-[.toaster]:text-white",
          warning: "group-[.toaster]:bg-yellow-500 group-[.toaster]:text-white",
        },
      }}
    />
  )
}

export { Toaster }