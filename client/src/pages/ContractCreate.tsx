import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { useQuery } from 'react-query'
import { api } from '../utils/api'

interface ContractForm {
  title: string
  description: string
  signers: Array<{
    name: string
    email: string
  }>
}

const ContractCreate = () => {
  const { documentId } = useParams()
  const location = useLocation()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Get predefined signers from template editor
  const predefinedSigners = location.state?.predefinedSigners || [{ name: '', email: '' }]

  const { register, control, handleSubmit, formState: { errors } } = useForm<ContractForm>({
    defaultValues: {
      signers: predefinedSigners
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'signers'
  })

  const { data: document, isLoading } = useQuery(
    ['document', documentId],
    () => api.get(`/documents/${documentId}`).then(res => res.data),
    { enabled: !!documentId }
  )

  const onSubmit = async (data: ContractForm) => {
    setIsCreating(true)
    setError('')

    try {
      const response = await api.post('/contracts', {
        ...data,
        documentId
      })

      navigate(`/contracts/${response.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create contract')
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Contract</h1>
        
        {document && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-900">Document</h3>
            <p className="text-sm text-gray-600">{document.originalName}</p>
            {predefinedSigners.length > 1 && (
              <p className="text-xs text-blue-600 mt-1">
                ✓ Template configured with signature fields
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contract Title
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter contract title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter contract description"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Signers</h3>
              <button
                type="button"
                onClick={() => append({ name: '', email: '' })}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                + Add Signer
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-sm font-medium text-gray-900">Signer {index + 1}</h4>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        {...register(`signers.${index}.name`, { required: 'Name is required' })}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter signer name"
                      />
                      {errors.signers?.[index]?.name && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.signers[index]?.name?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        {...register(`signers.${index}.email`, { 
                          required: 'Email is required',
                          pattern: {
                            value: /^\S+@\S+$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter signer email"
                      />
                      {errors.signers?.[index]?.email && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.signers[index]?.email?.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isCreating ? 'Creating Contract...' : 'Create Contract & Send Invitations'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ContractCreate