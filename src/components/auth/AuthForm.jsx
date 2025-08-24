'use client'

import { useState, useCallback, useMemo } from 'react'
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
  errorMessage: 'Authentication failed. Please try again.',
  phoneValidationError: 'Please enter a valid phone number (e.g., +1234567890)'
}

// Phone authentication configuration
const PHONE_AUTH_CONFIG = {
  emailDomain: '@phone.local',
  emailPrefix: 'phone_',
  passwordSuffix: '_secure_2024',
  phoneRegex: /^\+?[1-9]\d{1,14}$/
}

const FORM_FIELDS = {
  username: {
    type: 'text',
    placeholder: 'Username',
    required: true
  },
  name: {
    type: 'text',
    placeholder: 'Name',
    required: true
  },
  surname: {
    type: 'text',
    placeholder: 'Surname',
    required: true
  },
  email: {
    type: 'email',
    placeholder: 'Email',
    required: true
  },
  phone: {
    type: 'tel',
    placeholder: 'Phone Number (e.g., +1234567890)',
    required: true
  },
  password: {
    type: 'password',
    placeholder: 'Password',
    required: true
  }
}

// Utility functions
const cleanPhoneNumber = (phone) => phone.replace(/[^0-9]/g, '')

const generatePhoneCredentials = (phone) => {
  const cleanPhone = cleanPhoneNumber(phone)
  return {
    email: `${PHONE_AUTH_CONFIG.emailPrefix}${cleanPhone}${PHONE_AUTH_CONFIG.emailDomain}`,
    password: `${PHONE_AUTH_CONFIG.emailPrefix}${cleanPhone}${PHONE_AUTH_CONFIG.passwordSuffix}`
  }
}

const validatePhoneNumber = (phone) => {
  return PHONE_AUTH_CONFIG.phoneRegex.test(phone.replace(/\s/g, ''))
}

const isPhoneEmail = (email) => {
  return email.startsWith(PHONE_AUTH_CONFIG.emailPrefix) && email.endsWith(PHONE_AUTH_CONFIG.emailDomain)
}

const extractPhoneFromEmail = (email) => {
  if (!isPhoneEmail(email)) return null
  return email.replace(PHONE_AUTH_CONFIG.emailPrefix, '').replace(PHONE_AUTH_CONFIG.emailDomain, '')
}

// Custom hook for form state management
const useAuthForm = (onAuthSuccess) => {
  const [isLogin, setIsLogin] = useState(true)
  const [loginMode, setLoginMode] = useState('phone')
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    username: '',
    name: '',
    surname: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Memoized form reset function
  const resetForm = useCallback(() => {
    setFormData({ email: '', phone: '', password: '', username: '', name: '', surname: '' })
    setError('')
  }, [])

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const toggleMode = useCallback(() => {
    setIsLogin(prev => !prev)
    resetForm()
  }, [resetForm])

  const toggleLoginMode = useCallback(() => {
    setLoginMode(prev => prev === 'email' ? 'phone' : 'email')
    resetForm()
  }, [resetForm])

  // Memoized authentication functions
  const handleEmailAuth = useCallback(async (isLoginMode) => {
    if (isLoginMode) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })
      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { username: formData.username }
        }
      })
      if (error) throw error
      return data
    }
  }, [formData.email, formData.password, formData.username])

  const handlePhoneAuth = useCallback(async (isLoginMode) => {
    const { email, password } = generatePhoneCredentials(formData.phone)
    
    if (isLoginMode) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        // Handle specific error for non-existent user
        if (error.message === 'Invalid login credentials') {
          throw new Error('Phone number not registered. Please sign up first.')
        }
        throw error
      }
      return data
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: formData.name,
            surname: formData.surname,
            phone_number: formData.phone,
            username: `${formData.name} ${formData.surname}`
          }
        }
      })
      if (error) {
        // Handle specific error for already existing user
        if (error.message.includes('already registered')) {
          throw new Error('Phone number already registered. Please sign in instead.')
        }
        throw error
      }
      return data
    }
  }, [formData.phone, formData.name, formData.surname])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate phone number format for phone mode
      if (loginMode === 'phone' && formData.phone && !validatePhoneNumber(formData.phone)) {
        setError(AUTH_CONFIG.phoneValidationError)
        return
      }

      let data
      if (loginMode === 'email') {
        data = await handleEmailAuth(isLogin)
      } else {
        data = await handlePhoneAuth(isLogin)
      }

      if (data?.user) {
        onAuthSuccess(data.user)
      }
    } catch (error) {
      // Only log actual errors, not user-friendly messages
      if (!error.message.includes('Phone number not registered') && 
          !error.message.includes('Phone number already registered')) {
        console.error(`${loginMode} ${isLogin ? 'login' : 'signup'} error:`, error)
      }
      
      // Provide user-friendly error messages
      let userFriendlyError = error.message || AUTH_CONFIG.errorMessage
      
      if (loginMode === 'phone') {
        if (error.message === 'Phone number not registered. Please sign up first.') {
          userFriendlyError = 'Phone number not registered. Please sign up first.'
        } else if (error.message === 'Phone number already registered. Please sign in instead.') {
          userFriendlyError = 'Phone number already registered. Please sign in instead.'
        } else if (error.message === 'Invalid login credentials') {
          userFriendlyError = 'Phone number not registered. Please sign up first.'
        }
      }
      
      setError(userFriendlyError)
    } finally {
      setLoading(false)
    }
  }, [isLogin, loginMode, formData, handleEmailAuth, handlePhoneAuth, onAuthSuccess])

  return {
    isLogin,
    loginMode,
    formData,
    loading,
    error,
    updateField,
    toggleMode,
    toggleLoginMode,
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

const ErrorDisplay = ({ message, onToggleMode, isLogin, loginMode }) => {
  if (!message) return null
  
  // Determine if we should show a suggestion to switch modes
  const shouldShowSuggestion = loginMode === 'phone' && (
    message.includes('not registered') || 
    message.includes('already registered') ||
    message.includes('Invalid login credentials')
  )
  
  return (
    <div className="p-3 rounded-md bg-red-50 border border-red-200">
      <p className="text-red-600 text-sm mb-2">{message}</p>
      {shouldShowSuggestion && (
        <div className="mt-2 pt-2 border-t border-red-200">
          <p className="text-red-500 text-xs">
            💡 Tip: {isLogin ? 'Try signing up instead' : 'Try signing in instead'}
          </p>
          <button
            type="button"
            onClick={onToggleMode}
            className="text-blue-600 hover:text-blue-700 hover:underline text-xs font-medium mt-1 transition-colors duration-200"
          >
            Switch to {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      )}
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

const LoginModeToggle = ({ loginMode, onToggle }) => {
  const toggleOptions = useMemo(() => [
    { key: 'phone', label: 'Phone Login' },
    { key: 'email', label: 'Email Login' }
  ], [])

  return (
    <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
      {toggleOptions.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={onToggle}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            loginMode === option.key 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

// Memoized form field configurations
const getEmailFields = (isLogin, formData, updateField) => (
  <>
    {!isLogin && (
      <FormField
        field="username"
        config={FORM_FIELDS.username}
        value={formData.username}
        onChange={updateField}
      />
    )}
    <FormField
      field="email"
      config={FORM_FIELDS.email}
      value={formData.email}
      onChange={updateField}
    />
    <FormField
      field="password"
      config={FORM_FIELDS.password}
      value={formData.password}
      onChange={updateField}
    />
  </>
)

const getPhoneFields = (isLogin, formData, updateField) => (
  <>
    {!isLogin && (
      <>
        <FormField
          field="name"
          config={FORM_FIELDS.name}
          value={formData.name}
          onChange={updateField}
        />
        <FormField
          field="surname"
          config={FORM_FIELDS.surname}
          value={formData.surname}
          onChange={updateField}
        />
      </>
    )}
    <FormField
      field="phone"
      config={FORM_FIELDS.phone}
      value={formData.phone}
      onChange={updateField}
    />
  </>
)

export default function AuthForm({ onAuthSuccess }) {
  const {
    isLogin,
    loginMode,
    formData,
    loading,
    error,
    updateField,
    toggleMode,
    toggleLoginMode,
    handleSubmit
  } = useAuthForm(onAuthSuccess)

  const currentConfig = useMemo(() => 
    isLogin ? AUTH_CONFIG.login : AUTH_CONFIG.signup, 
    [isLogin]
  )

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
        <LoginModeToggle loginMode={loginMode} onToggle={toggleLoginMode} />
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {loginMode === 'email' 
            ? getEmailFields(isLogin, formData, updateField)
            : getPhoneFields(isLogin, formData, updateField)
          }
          
          <ErrorDisplay 
            message={error} 
            onToggleMode={toggleMode}
            isLogin={isLogin}
            loginMode={loginMode}
          />
          <SubmitButton loading={loading} isLogin={isLogin} />
        </form>
        
        <ModeToggle isLogin={isLogin} onToggle={toggleMode} />
      </CardContent>
    </Card>
  )
}

// Export utility functions for use in other components (like admin dashboard)
export { isPhoneEmail, extractPhoneFromEmail } 