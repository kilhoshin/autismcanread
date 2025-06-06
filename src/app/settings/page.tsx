'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Trash2, AlertTriangle, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function Settings() {
  const router = useRouter()
  const { user, profile, signOut } = useAuth()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  if (!user) {
    router.push('/login')
    return null
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      alert('Please type "DELETE" to confirm account deletion.')
      return
    }

    setIsDeleting(true)
    
    try {
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Account deleted:', result)
        
        // Sign out user
        await signOut()
        
        // Redirect to home with deletion confirmation
        router.push('/?deleted=true')
      } else {
        const error = await response.json()
        console.error('❌ Delete account error:', error)
        alert(`Failed to delete account: ${error.error}`)
      }
    } catch (error) {
      console.error('❌ Exception deleting account:', error)
      alert('An error occurred while deleting your account. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/dashboard" className="mr-4 p-2 rounded-lg hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-6">
            <User className="w-6 h-6 text-blue-500 mr-3" />
            <h2 className="text-xl font-semibold">Account Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Status</label>
              <p className="text-gray-900">
                {profile?.subscription_status === 'premium' ? '🟢 Premium Member' : 
                 profile?.subscription_status === 'cancelled' ? '🟡 Premium (Cancelled)' : 
                 '🔵 Free Member'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Member Since</label>
              <p className="text-gray-900">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-red-200">
          <div className="flex items-center mb-6">
            <Shield className="w-6 h-6 text-red-500 mr-3" />
            <h2 className="text-xl font-semibold text-red-700">Danger Zone</h2>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Delete Account</h3>
                <p className="text-sm text-red-700 mt-1">
                  This action will permanently delete your account and all associated data. 
                  Your subscription will be cancelled immediately, but payment history will be preserved in Stripe.
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">Confirm Account Deletion</h2>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you absolutely sure you want to delete your account? This will:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Cancel your subscription immediately</li>
                <li>• Delete all your worksheet history</li>
                <li>• Deactivate your account permanently</li>
                <li>• Preserve payment history in Stripe</li>
              </ul>
              
              <p className="text-red-600 font-medium mb-4">
                This action cannot be undone.
              </p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "DELETE" to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Type DELETE here"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmation('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
