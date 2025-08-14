import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Document, Page, pdfjs } from 'react-pdf'
import SignaturePad from '../components/SignaturePad'
import { api } from '../utils/api'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface SignaturePosition {
  x: number
  y: number
  width: number
  height: number
  pageNumber: number
}

const SignDocument = () => {
  const { contractId } = useParams()
  const [searchParams] = useSearchParams()
  const signerId = searchParams.get('signer')
  const queryClient = useQueryClient()

  const [numPages, setNumPages] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const [signatureData, setSignatureData] = useState<string>('')
  const [signaturePosition, setSignaturePosition] = useState<SignaturePosition | null>(null)
  const [isPlacingSignature, setIsPlacingSignature] = useState(false)

  const { data: contract, isLoading } = useQuery(
    ['contract', contractId],
    () => api.get(`/contracts/${contractId}`).then(res => res.data),
    { enabled: !!contractId }
  )

  const { data: signatures } = useQuery(
    ['signatures', contractId],
    () => api.get(`/signatures/contract/${contractId}`).then(res => res.data),
    { enabled: !!contractId }
  )

  const signMutation = useMutation(
    (signatureData: any) => api.post('/signatures', signatureData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['contract', contractId])
        queryClient.invalidateQueries(['signatures', contractId])
        setShowSignaturePad(false)
        setSignatureData('')
        setSignaturePosition(null)
        alert('Document signed successfully!')
      }
    }
  )

  const signer = contract?.signers.find((s: any) => s.id === signerId)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  const handlePageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacingSignature || !signatureData) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    setSignaturePosition({
      x,
      y,
      width: 20,
      height: 10,
      pageNumber: currentPage
    })
    setIsPlacingSignature(false)
  }

  const handleSignature = (data: string) => {
    setSignatureData(data)
  }

  const handlePlaceSignature = () => {
    if (!signatureData) {
      setShowSignaturePad(true)
      return
    }
    setIsPlacingSignature(true)
  }

  const handleSubmitSignature = () => {
    if (!signaturePosition || !signatureData || !signerId) return

    signMutation.mutate({
      signerId,
      signatureData,
      positionX: signaturePosition.x,
      positionY: signaturePosition.y,
      width: signaturePosition.width,
      height: signaturePosition.height,
      pageNumber: signaturePosition.pageNumber
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!contract || !signer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Signing Link</h1>
          <p className="text-gray-600">This signing link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  if (signer.status === 'signed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center">
          <svg className="h-16 w-16 text-green-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Document Already Signed</h1>
          <p className="text-gray-600">You have already signed this document.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{contract.title}</h1>
              <p className="text-sm text-gray-600">Signing as: {signer.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              {isPlacingSignature && (
                <p className="text-sm text-blue-600">Click on the document to place your signature</p>
              )}
              <button
                onClick={handlePlaceSignature}
                disabled={!signatureData}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {signatureData ? 'Place Signature' : 'Create Signature'}
              </button>
              {signaturePosition && (
                <button
                  onClick={handleSubmitSignature}
                  disabled={signMutation.isLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {signMutation.isLoading ? 'Signing...' : 'Submit Signature'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Document</h2>
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
              
              <div className="relative" onClick={handlePageClick}>
                <Document
                  file={`/api/documents/${contract.document.id}/file`}
                  onLoadSuccess={onDocumentLoadSuccess}
                  className="flex justify-center"
                >
                  <div className="relative">
                    <Page pageNumber={currentPage} width={800} />
                    
                    {signatures?.filter((sig: any) => sig.pageNumber === currentPage).map((sig: any) => (
                      <div
                        key={sig.id}
                        className="absolute border-2 border-blue-500 bg-blue-100 opacity-75"
                        style={{
                          left: `${sig.positionX}%`,
                          top: `${sig.positionY}%`,
                          width: `${sig.width}%`,
                          height: `${sig.height}%`,
                        }}
                      >
                        <img
                          src={sig.signatureData}
                          alt="Signature"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ))}
                    
                    {signaturePosition && signaturePosition.pageNumber === currentPage && (
                      <div
                        className="absolute border-2 border-green-500 bg-green-100 opacity-75"
                        style={{
                          left: `${signaturePosition.x}%`,
                          top: `${signaturePosition.y}%`,
                          width: `${signaturePosition.width}%`,
                          height: `${signaturePosition.height}%`,
                        }}
                      >
                        <img
                          src={signatureData}
                          alt="Your signature"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                </Document>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Signature</h3>
              {showSignaturePad ? (
                <div>
                  <SignaturePad onSignature={handleSignature} width={300} height={150} />
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => setShowSignaturePad(false)}
                      className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  {signatureData ? (
                    <div>
                      <img src={signatureData} alt="Your signature" className="border rounded mb-4" />
                      <button
                        onClick={() => setShowSignaturePad(true)}
                        className="text-sm text-blue-600 hover:text-blue-500"
                      >
                        Edit Signature
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600 mb-4">
                        Create your digital signature to sign this document.
                      </p>
                      <button
                        onClick={() => setShowSignaturePad(true)}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                      >
                        Create Signature
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white shadow rounded-lg p-4 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Other Signers</h3>
              <div className="space-y-3">
                {contract.signers
                  .filter((s: any) => s.id !== signerId)
                  .map((signer: any) => (
                    <div key={signer.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{signer.name}</p>
                        <p className="text-xs text-gray-500">{signer.email}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        signer.status === 'signed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {signer.status}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignDocument