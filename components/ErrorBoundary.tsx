"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />
      }

      return (
        <DefaultErrorFallback 
          error={this.state.error!} 
          resetError={this.resetError} 
        />
      )
    }

    return this.props.children
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">Có lỗi xảy ra</CardTitle>
          <CardDescription>
            Đã xảy ra lỗi không mong muốn. Vui lòng thử lại hoặc liên hệ hỗ trợ.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-gray-100 rounded text-sm font-mono text-gray-700">
            {error.message}
          </div>
          <div className="flex space-x-2">
            <Button onClick={resetError} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Thử lại
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Tải lại trang
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// API Error fallback component
export function ApiErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  const isNetworkError = error.message.includes('fetch') || error.message.includes('Network')
  
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-red-800 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          {isNetworkError ? 'Lỗi kết nối' : 'Lỗi API'}
        </CardTitle>
        <CardDescription className="text-red-600">
          {isNetworkError 
            ? 'Không thể kết nối tới server. Vui lòng kiểm tra kết nối mạng và thử lại.'
            : 'Có lỗi xảy ra khi tải dữ liệu từ server.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="p-3 bg-white rounded border border-red-200 text-sm">
            <strong>Chi tiết lỗi:</strong>
            <div className="mt-1 font-mono text-red-700">{error.message}</div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={resetError} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Thử lại
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Check API health
                fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/api/health')
                  .then(() => resetError())
                  .catch(() => alert('Server vẫn chưa sẵn sàng. Vui lòng thử lại sau.'))
              }}
            >
              Kiểm tra kết nối
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading fallback component
export function LoadingFallback({ message = "Đang tải..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

// Empty state component
export function EmptyState({ 
  title, 
  description, 
  action 
}: { 
  title: string
  description: string
  action?: React.ReactNode 
}) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
        <AlertTriangle className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {action}
    </div>
  )
}
