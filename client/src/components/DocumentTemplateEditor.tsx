import { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { useMutation, useQueryClient, useQuery } from 'react-query'
import { api } from '../utils/api'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

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
          responseType: 'blob'
        })
        console.log('PDF response:', response)
        console.log('Response data type:', typeof response.data)
        console.log('Response data size:', response.data.size)
        
        const blob = new Blob([response.data], { type: 'application/pdf' })
        console.log('Created blob:', blob)
        console.log('Blob size:', blob.size)
        console.log('Blob type:', blob.type)
        
        const url = URL.createObjectURL(blob)
        console.log('Created object URL:', url)
        setPdfUrl(url)
        setPdfLoading(false)
      } catch (error: any) {
        console.error('Error fetching PDF:', error)
        console.error('Error details:', error.response || error.message)
        setPdfError(error.response?.data?.error || error.message || 'Failed to load PDF')
        setPdfLoading(false)
      }
    }

    fetchPdf()

    // Cleanup object URL when component unmounts
    return () => {
      if (pdfUrl) {
        console.log('Cleaning up PDF URL:', pdfUrl)
        URL.revokeObjectURL(pdfUrl)
      }
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
    if (!isPlacingField || !selectedSigner || !pdfContainerRef.current) return

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

        {/* Field List */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Fields on Page {currentPage}
          </h3>
          <div className="space-y-2">
            {currentPageFields.map((field: SignatureField) => (
              <div
                key={field.id}
                className="p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm">
                      {field.fieldType.charAt(0).toUpperCase() + field.fieldType.slice(1)}
                    </div>
                    <div className="text-xs text-gray-500">{field.signerName}</div>
                  </div>
                  <button
                    onClick={() => field.id && deleteFieldMutation.mutate(field.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {currentPageFields.length === 0 && (
              <p className="text-sm text-gray-500 italic">No fields on this page</p>
            )}
          </div>
        </div>

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
                  {currentPageFields.map((field: SignatureField) => (
                  <div
                    key={field.id}
                    className="absolute border-2 bg-opacity-10 flex items-center justify-center text-xs font-medium cursor-pointer hover:bg-opacity-20 transition-opacity"
                    style={{
                      left: `${field.positionX}%`,
                      top: `${field.positionY}%`,
                      width: `${field.width}%`,
                      height: `${field.height}%`,
                      borderColor: getSignerColor(field.signerEmail || ''),
                      backgroundColor: getSignerColor(field.signerEmail || ''),
                      color: getSignerColor(field.signerEmail || '')
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      // Could add field editing here
                    }}
                  >
                    {field.fieldType.toUpperCase()}
                  </div>
                  ))}
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