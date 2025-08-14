import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { api } from '../utils/api'

const ContractView = () => {
  const { contractId } = useParams()

  const { data: contract, isLoading } = useQuery(
    ['contract', contractId],
    () => api.get(`/contracts/${contractId}`).then(res => res.data),
    { enabled: !!contractId }
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Contract not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{contract.title}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getContractStatusColor(contract.status)}`}>
              {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
            </span>
          </div>
          {contract.description && (
            <p className="text-gray-600 mt-2">{contract.description}</p>
          )}
          <div className="mt-4 text-sm text-gray-500">
            <p>Created: {new Date(contract.createdAt).toLocaleDateString()}</p>
            {contract.completedAt && (
              <p>Completed: {new Date(contract.completedAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Document</h2>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-10 w-10 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-900">{contract.document.originalName}</p>
                  <p className="text-sm text-gray-500">
                    Created by {contract.document.createdBy.name}
                  </p>
                </div>
                <a
                  href={`/api/documents/${contract.document.id}/file`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-500 text-sm"
                >
                  View PDF
                </a>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Signers ({contract.signers.filter((s: any) => s.status === 'signed').length}/{contract.signers.length} signed)
            </h2>
            <div className="space-y-3">
              {contract.signers.map((signer: any) => (
                <div key={signer.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{signer.name}</p>
                      <p className="text-sm text-gray-500">{signer.email}</p>
                      {signer.signedAt && (
                        <p className="text-xs text-gray-400">
                          Signed: {new Date(signer.signedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(signer.status)}`}>
                        {signer.status.charAt(0).toUpperCase() + signer.status.slice(1)}
                      </span>
                      {signer.signatures.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {signer.signatures.length} signature(s)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {contract.status === 'completed' && (
          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Contract Completed</h3>
                <p className="text-sm text-green-700 mt-1">
                  All parties have signed this contract. The document is now legally binding.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContractView