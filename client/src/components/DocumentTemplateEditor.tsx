import { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { useMutation, useQueryClient, useQuery } from 'react-query'
import { api } from '../utils/api'

// Use local worker to avoid CSP issues
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

interface SignatureField {
  id?: string
  fieldType: 'signature' | 'date' | 'text' | 'initials'
  signerEmail?: string
  signerName?: string
  label: string
  isRequired: boolean
  positionX: number
  positionY: number
  width: number
  height: number
  pageNumber: number
}

interface Signer {
  email: string
  name: string
  color: string
}

interface DocumentTemplateEditorProps {
  documentId: string
  signers: Signer[]
  onSave: () => void
}

const FIELD_TYPES = [
  { type: 'signature', label: 'Signature', icon: '✍️', width: 150, height: 50 },
  { type: 'date', label: 'Date', icon: '📅', width: 100, height: 30 },
  { type: 'text', label: 'Text', icon: '📝', width: 150, height: 30 },
  { type: 'initials', label: 'Initials', icon: '🔤', width: 80, height: 40 }
]

const SIGNER_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6']

const DocumentTemplateEditor: React.FC<DocumentTemplateEditorProps> = ({
  documentId,
  signers,
  onSave
}) => {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedFieldType, setSelectedFieldType] = useState<string>('signature')
  const [selectedSigner, setSelectedSigner] = useState<Signer | null>(signers[0] || null)
  const [isPlacingField, setIsPlacingField] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(true)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [selectedField, setSelectedField] = useState<SignatureField | null>(null)
  const queryClient = useQueryClient()
  const pdfContainerRef = useRef<HTMLDivElement>(null)

  // Fetch PDF with authentication
  useEffect(() => {
    const fetchPdf = async () => {
      if (!documentId) return
      
      setPdfLoading(true)
      setPdfError(null)
      
      try {
        console.log('Fetching PDF for document:', documentId)
        const response = await api.get(`/documents/${documentId}/file`, {
          responseType: 'arraybuffer'
        })
        console.log('PDF response:', response)
        console.log('Response data type:', typeof response.data)
        console.log('Response data size:', response.data.byteLength)
        
        // Convert ArrayBuffer to base64 data URL to avoid CSP blob issues
        const arrayBuffer = response.data
        const bytes = new Uint8Array(arrayBuffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        const base64 = btoa(binary)
        const dataUrl = `data:application/pdf;base64,${base64}`
        
        console.log('Created data URL length:', dataUrl.length)
        setPdfUrl(dataUrl)
        setPdfLoading(false)
      } catch (error: any) {
        console.error('Error fetching PDF:', error)
        console.error('Error details:', error.response || error.message)
        setPdfError(error.response?.data?.error || error.message || 'Failed to load PDF')
        setPdfLoading(false)
      }
    }

    fetchPdf()

    // No cleanup needed for data URLs (unlike blob URLs)
    return () => {
      console.log('Component cleanup - no URL revocation needed for data URLs')
    }
  }, [documentId])

  // Get existing signature fields
  const { data: signatureFields = [] } = useQuery(
    ['signatureFields', documentId],
    () => api.get(`/signature-fields/document/${documentId}`).then(res => res.data)
  )

  // Create signature field mutation
  const createFieldMutation = useMutation(
    (fieldData: Omit<SignatureField, 'id'>) => 
      api.post('/signature-fields', { ...fieldData, documentId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['signatureFields', documentId])
        setIsPlacingField(false)
      }
    }
  )

  // Delete signature field mutation
  const deleteFieldMutation = useMutation(
    (fieldId: string) => api.delete(`/signature-fields/${fieldId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['signatureFields', documentId])
      }
    }
  )

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  const handleFieldTypeClick = (fieldType: string) => {
    setSelectedFieldType(fieldType)
    setIsPlacingField(true)
  }

  const handlePageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Clear selected field when clicking on empty space
    if (!isPlacingField) {
      setSelectedField(null)
      return
    }

    if (!selectedSigner || !pdfContainerRef.current) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    const fieldTypeConfig = FIELD_TYPES.find(f => f.type === selectedFieldType)
    if (!fieldTypeConfig) return

    const newField: Omit<SignatureField, 'id'> = {
      fieldType: selectedFieldType as SignatureField['fieldType'],
      signerEmail: selectedSigner.email,
      signerName: selectedSigner.name,
      label: fieldTypeConfig.label,
      isRequired: true,
      positionX: x,
      positionY: y,
      width: (fieldTypeConfig.width / rect.width) * 100,
      height: (fieldTypeConfig.height / rect.height) * 100,
      pageNumber: currentPage
    }

    createFieldMutation.mutate(newField)
  }

  const getSignerColor = (signerEmail: string) => {
    const signerIndex = signers.findIndex(s => s.email === signerEmail)
    return SIGNER_COLORS[signerIndex % SIGNER_COLORS.length]
  }

  const currentPageFields = signatureFields.filter(
    (field: SignatureField) => field.pageNumber === currentPage
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Field Palette */}
      <div className="w-80 bg-white shadow-lg p-6 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-6">Document Template Editor</h2>
        
        {/* Field Types */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Field Types</h3>
          <div className="grid grid-cols-2 gap-2">
            {FIELD_TYPES.map((fieldType) => (
              <button
                key={fieldType.type}
                onClick={() => handleFieldTypeClick(fieldType.type)}
                className={`p-3 border-2 border-dashed rounded-lg text-center hover:border-blue-500 transition-colors ${
                  selectedFieldType === fieldType.type && isPlacingField
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{fieldType.icon}</div>
                <div className="text-xs font-medium">{fieldType.label}</div>
              </button>
            ))}
          </div>
          {isPlacingField && (
            <p className="text-sm text-blue-600 mt-2">
              Click on the document to place a {selectedFieldType} field
            </p>
          )}
        </div>

        {/* Signer Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Assign to Signer</h3>
          <div className="space-y-2">
            {signers.map((signer, index) => (
              <button
                key={signer.email}
                onClick={() => setSelectedSigner(signer)}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  selectedSigner?.email === signer.email
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: SIGNER_COLORS[index % SIGNER_COLORS.length] }}
                  />
                  <div>
                    <div className="font-medium text-sm">{signer.name}</div>
                    <div className="text-xs text-gray-500">{signer.email}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Field Properties or Field List */}
        {selectedField ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Field Properties</h3>
              <button
                onClick={() => setSelectedField(null)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="font-medium text-sm text-blue-900">
                  {selectedField.fieldType.charAt(0).toUpperCase() + selectedField.fieldType.slice(1)} Field
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  Assigned to: {selectedField.signerName || 'Unassigned'}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Page {selectedField.pageNumber} • Required: {selectedField.isRequired ? 'Yes' : 'No'}
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Field Label
                  </label>
                  <input
                    type="text"
                    value={selectedField.label}
                    onChange={(e) => {
                      // TODO: Add field update mutation
                      console.log('Update field label:', e.target.value)
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter field label"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="required"
                    checked={selectedField.isRequired}
                    onChange={(e) => {
                      // TODO: Add field update mutation
                      console.log('Update field required:', e.target.checked)
                    }}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="required" className="ml-2 text-xs text-gray-700">
                    Required field
                  </label>
                </div>
              </div>
              
              <div className="pt-3 border-t">
                <button
                  onClick={() => {
                    if (selectedField.id) {
                      deleteFieldMutation.mutate(selectedField.id)
                      setSelectedField(null)
                    }
                  }}
                  disabled={deleteFieldMutation.isLoading}
                  className="w-full px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50"
                >
                  {deleteFieldMutation.isLoading ? 'Deleting...' : 'Delete Field'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Fields on Page {currentPage}
            </h3>
            <div className="space-y-2">
              {currentPageFields.map((field: SignatureField) => (
                <div
                  key={field.id}
                  className="p-3 bg-gray-50 rounded-lg border cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setSelectedField(field)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">
                        {field.fieldType.charAt(0).toUpperCase() + field.fieldType.slice(1)}
                      </div>
                      <div className="text-xs text-gray-500">{field.signerName}</div>
                    </div>
                    <div className="text-xs text-gray-400">
                      Click to edit
                    </div>
                  </div>
                </div>
              ))}
              {currentPageFields.length === 0 && (
                <p className="text-sm text-gray-500 italic">No fields on this page</p>
              )}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t">
          <button
            onClick={onSave}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Save Template & Continue
          </button>
        </div>
      </div>

      {/* Main Content - Document Viewer */}
      <div className="flex-1 p-6">
        <div className="bg-white rounded-lg shadow-lg h-full">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-medium">Document Preview</h3>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {numPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(numPages || 1, currentPage + 1))}
                  disabled={currentPage === numPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Document */}
          <div className="p-4 h-full overflow-auto">
            <div className="flex justify-center">
              {pdfLoading && (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading PDF...</span>
                </div>
              )}
              
              {pdfError && (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="text-red-500 text-lg mb-2">Failed to load PDF</div>
                    <div className="text-gray-600 text-sm">{pdfError}</div>
                    <button 
                      onClick={() => window.location.reload()}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
              
              {!pdfLoading && !pdfError && pdfUrl && (
                <div 
                  ref={pdfContainerRef}
                  className="relative cursor-crosshair"
                  onClick={handlePageClick}
                >
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                  >
                    <Page pageNumber={currentPage} width={800} />
                  </Document>

                  {/* Render signature fields */}
                  {currentPageFields.map((field: SignatureField) => {
                    const isSelected = selectedField?.id === field.id
                    const signerColor = getSignerColor(field.signerEmail || '')
                    
                    return (
                      <div
                        key={field.id}
                        className={`absolute border-2 flex items-center justify-center text-xs font-medium cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 shadow-lg' 
                            : 'border-dashed hover:border-solid hover:shadow-md'
                        }`}
                        style={{
                          left: `${field.positionX}%`,
                          top: `${field.positionY}%`,
                          width: `${field.width}%`,
                          height: `${field.height}%`,
                          borderColor: isSelected ? '#3B82F6' : signerColor,
                          backgroundColor: isSelected ? '#EFF6FF' : 'rgba(255, 255, 255, 0.9)',
                          color: isSelected ? '#1D4ED8' : signerColor
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedField(field)
                        }}
                      >
                        <div className="text-center">
                          <div className="font-semibold">
                            {field.fieldType.charAt(0).toUpperCase() + field.fieldType.slice(1)}
                          </div>
                          <div className="text-xs opacity-75">
                            {field.signerName || 'Unassigned'}
                          </div>
                        </div>
                        
                        {isSelected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (field.id) {
                                deleteFieldMutation.mutate(field.id)
                                setSelectedField(null)
                              }
                            }}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                            title="Delete field"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentTemplateEditor