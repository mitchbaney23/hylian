import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { useState } from 'react'
import { api } from '../utils/api'
import DocumentTemplateEditor from '../components/DocumentTemplateEditor'

const DocumentTemplate = () => {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const [signers, setSigners] = useState([
    { email: '', name: '', color: '#3B82F6' }
  ])
  const [showEditor, setShowEditor] = useState(false)

  const { data: document, isLoading } = useQuery(
    ['document', documentId],
    () => api.get(`/documents/${documentId}`).then(res => res.data),
    { enabled: !!documentId }
  )

  const addSigner = () => {
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6']
    setSigners([
      ...signers,
      { 
        email: '', 
        name: '', 
        color: colors[signers.length % colors.length] 
      }
    ])
  }

  const removeSigner = (index: number) => {
    if (signers.length > 1) {
      setSigners(signers.filter((_, i) => i !== index))
    }
  }

  const updateSigner = (index: number, field: string, value: string) => {
    const updatedSigners = [...signers]
    updatedSigners[index] = { ...updatedSigners[index], [field]: value }
    setSigners(updatedSigners)
  }

  const handleSaveTemplate = () => {
    // Navigate to contract creation with the signers
    const validSigners = signers.filter(s => s.email && s.name)
    if (validSigners.length === 0) {
      alert('Please add at least one signer')
      return
    }
    
    // Pass signers data to contract creation
    navigate(`/contracts/create/${documentId}`, { 
      state: { predefinedSigners: validSigners } 
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Document not found</p>
      </div>
    )
  }

  // Show editor only when explicitly requested
  if (!showEditor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Prepare Document Template</h1>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-900">Document</h3>
            <p className="text-sm text-gray-600">{document.originalName}</p>
          </div>

          <h2 className="text-lg font-medium text-gray-900 mb-4">Add Signers</h2>
          
          <div className="space-y-4">
            {signers.map((signer, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-sm font-medium text-gray-900">Signer {index + 1}</h4>
                  {signers.length > 1 && (
                    <button
                      onClick={() => removeSigner(index)}
                      className="text-red-600 hover:text-red-500 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={signer.name}
                      onChange={(e) => updateSigner(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter signer name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={signer.email}
                      onChange={(e) => updateSigner(index, 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter signer email"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={addSigner}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              + Add Another Signer
            </button>

            <div className="space-x-3">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const validSigners = signers.filter(s => s.email && s.name)
                  if (validSigners.length === 0) {
                    alert('Please add at least one signer with name and email')
                    return
                  }
                  setSigners(validSigners)
                  setShowEditor(true)
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Continue to Template Editor
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DocumentTemplateEditor
      documentId={documentId!}
      signers={signers}
      onSave={handleSaveTemplate}
    />
  )
}

export default DocumentTemplate