// Remove unused import
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { api } from '../utils/api'

const Dashboard = () => {
  const { data: documents, isLoading: documentsLoading } = useQuery(
    'documents',
    () => api.get('/documents').then(res => res.data)
  )

  const { data: contracts, isLoading: contractsLoading } = useQuery(
    'contracts',
    () => api.get('/contracts').then(res => res.data)
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  if (documentsLoading || contractsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-600">Manage your documents and contracts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Documents</h2>
            <Link
              to="/upload"
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Upload New
            </Link>
          </div>
          
          {documents && documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc: any) => (
                <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{doc.originalName}</h3>
                      <p className="text-xs text-gray-500">
                        Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                      {doc.contracts.length === 0 && (
                        <Link
                          to={`/documents/${doc.id}/template`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Prepare for Signing
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No documents yet</p>
              <Link
                to="/upload"
                className="text-blue-600 hover:text-blue-500 text-sm"
              >
                Upload your first document
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Contracts</h2>
          
          {contracts && contracts.length > 0 ? (
            <div className="space-y-3">
              {contracts.map((contract: any) => (
                <div key={contract.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{contract.title}</h3>
                      <p className="text-xs text-gray-500">
                        {contract.signers.length} signers • Created {new Date(contract.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                        {contract.status}
                      </span>
                      <Link
                        to={`/contracts/${contract.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No contracts yet</p>
              <p className="text-sm text-gray-400">Upload a document to create your first contract</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard