import React, { useRef, useEffect } from 'react'
import SignaturePadLib from 'signature_pad'

interface SignaturePadProps {
  onSignature: (signatureData: string) => void
  width?: number
  height?: number
}

const SignaturePad: React.FC<SignaturePadProps> = ({ 
  onSignature, 
  width = 400, 
  height = 200 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signaturePadRef = useRef<SignaturePadLib | null>(null)

  useEffect(() => {
    if (canvasRef.current) {
      signaturePadRef.current = new SignaturePadLib(canvasRef.current, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
      })

      signaturePadRef.current.addEventListener('endStroke', () => {
        if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
          const signatureData = signaturePadRef.current.toDataURL()
          onSignature(signatureData)
        }
      })
    }

    return () => {
      if (signaturePadRef.current) {
        signaturePadRef.current.off()
      }
    }
  }, [onSignature])

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear()
    }
  }

  return (
    <div className="signature-pad-container">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="signature-canvas border-2 border-dashed border-gray-300 rounded-lg"
      />
      <div className="mt-2">
        <button
          onClick={clearSignature}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Clear Signature
        </button>
      </div>
    </div>
  )
}

export default SignaturePad