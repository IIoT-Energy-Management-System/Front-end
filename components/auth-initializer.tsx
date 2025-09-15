// "use client"

// import { useAppStore } from "@/lib/store"
// import { useEffect } from "react"

// interface AuthInitializerProps {
//   children: React.ReactNode
// }

// export function AuthInitializer({ children }: AuthInitializerProps) {
//   const { checkAuthStatus } = useAppStore()

//   useEffect(() => {
//     // Check authentication status when app initializes
//     checkAuthStatus()
//   }, [checkAuthStatus])

//   return <>{children}</>
// }
