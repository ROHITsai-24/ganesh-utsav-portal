'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Configuration objects for dynamic content
const AUTH_CONFIG = {
  login: {
    title: 'Login',
    description: 'Enter your credentials to play the game',
    submitText: 'Login',
    switchText: 'Need an account? Sign up'
  },
  signup: {
    title: 'Sign Up',
    description: 'Create an account to start playing',
    submitText: 'Sign Up',
    switchText: 'Already have an account? Login'
  },
  loadingText: 'Loading...',
  errorMessage: 'Authentication failed. Please try again.'
}

const FORM_FIELDS = {
  username: {
    type: 'text',
    placeholder: 'Username',
    required: true
  },
  email: {
    type: 'email',
    placeholder: 'Email',
    required: true
  },
  password: {
    type: 'password',
    placeholder: 'Password',
    required: true
  }
}

// Custom hook for form state management
const useAuthForm = (onAuthSuccess) => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const toggleMode = useCallback(() => {
    setIsLogin(prev => !prev)
    setError('')
    setFormData({ email: '', password: '', username: '' })
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        if (error) {
          console.error('Login error:', error)
          throw error
        }
        if (data.user) {
          console.log('Login successful, calling onAuthSuccess')
          onAuthSuccess(data.user)
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              username: formData.username,
            }
          }
        })
        if (error) {
          console.error('Signup error:', error)
          throw error
        }
        if (data.user) {
          console.log('Signup successful, calling onAuthSuccess')
          onAuthSuccess(data.user)
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      setError(error.message || AUTH_CONFIG.errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isLogin, formData, onAuthSuccess])

  return {
    isLogin,
    formData,
    loading,
    error,
    updateField,
    toggleMode,
    handleSubmit
  }
}

// Reusable components
const FormField = ({ field, config, value, onChange, required = false }) => (
  <div>
    <Input
      type={config.type}
      placeholder={config.placeholder}
      value={value}
      onChange={(e) => onChange(field, e.target.value)}
      required={required || config.required}
      className="w-full"
    />
  </div>
)

const ErrorDisplay = ({ message }) => {
  if (!message) return null
  
  return (
    <div className="p-3 rounded-md bg-red-50 border border-red-200">
      <p className="text-red-600 text-sm">{message}</p>
    </div>
  )
}

const SubmitButton = ({ loading, isLogin }) => (
  <Button 
    type="submit" 
    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200" 
    disabled={loading}
  >
    {loading ? AUTH_CONFIG.loadingText : (isLogin ? AUTH_CONFIG.login.submitText : AUTH_CONFIG.signup.submitText)}
  </Button>
)

const ModeToggle = ({ isLogin, onToggle }) => (
  <div className="mt-4 text-center">
    <button
      type="button"
      onClick={onToggle}
      className="text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium transition-colors duration-200"
    >
      {isLogin ? AUTH_CONFIG.login.switchText : AUTH_CONFIG.signup.switchText}
    </button>
  </div>
)

export default function AuthForm({ onAuthSuccess }) {
  const {
    isLogin,
    formData,
    loading,
    error,
    updateField,
    toggleMode,
    handleSubmit
  } = useAuthForm(onAuthSuccess)

  const currentConfig = isLogin ? AUTH_CONFIG.login : AUTH_CONFIG.signup

  return (
    <Card className="w-full bg-white/95 backdrop-blur-sm shadow-xl border-0">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl font-bold text-gray-800">
          {currentConfig.title}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {currentConfig.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username field - only show for signup */}
          {!isLogin && (
            <FormField
              field="username"
              config={FORM_FIELDS.username}
              value={formData.username}
              onChange={updateField}
            />
          )}
          
          {/* Email field */}
          <FormField
            field="email"
            config={FORM_FIELDS.email}
            value={formData.email}
            onChange={updateField}
          />
          
          {/* Password field */}
          <FormField
            field="password"
            config={FORM_FIELDS.password}
            value={formData.password}
            onChange={updateField}
          />
          
          {/* Error display */}
          <ErrorDisplay message={error} />
          
          {/* Submit button */}
          <SubmitButton loading={loading} isLogin={isLogin} />
        </form>
        
        {/* Mode toggle */}
        <ModeToggle isLogin={isLogin} onToggle={toggleMode} />
      </CardContent>
    </Card>
  )
} 