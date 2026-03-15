import React, { useRef, useEffect, useState } from 'react'
import { Camera, X, CheckCircle2, Scan, Loader2, RefreshCw } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

// OCR.space API Integration (Free, No Credit Card Required)
const OCR_SPACE_KEY = 'K86247942788957' 
const OCR_API_URL = 'https://api.ocr.space/parse/image'

export const Scanner = ({ isOpen, onClose, onScan, title = 'Quét biển số AI' }) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [isCameraMode, setIsCameraMode] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState(null)
  const [scanResult, setScanResult] = useState('')
  const [isConfirmed, setIsConfirmed] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      resetState()
    }
  }, [isOpen])

  const resetState = () => {
    setIsCameraMode(false)
    setSelectedImage(null)
    setSelectedFile(null)
    setScanResult('')
    setError(null)
    setIsScanning(false)
  }

  const startCamera = async () => {
    try {
      setIsCameraMode(true)
      setSelectedImage(null)
      setSelectedFile(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setStream(mediaStream)
      setError(null)
    } catch (err) {
      console.error('Camera Error:', err)
      setError('Không thể truy cập camera. Vui lòng cấp quyền truy cập.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsScanning(false)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    stopCamera()
    setIsCameraMode(false)
    setSelectedFile(file)
    setSelectedImage(URL.createObjectURL(file))
    setError(null)
    setScanResult('')
  }

  const handleScan = async () => {
    if (!selectedFile && (!videoRef.current || !stream)) return
    setIsScanning(true)
    setError(null)

    try {
      let uploadBlob = selectedFile

      // 1. Get Image Data
      if (isCameraMode && videoRef.current) {
        const video = videoRef.current
        const canvas = canvasRef.current
        const cropWidth = video.videoWidth * 0.8
        const cropHeight = video.videoHeight * 0.4
        const startX = (video.videoWidth - cropWidth) / 2
        const startY = (video.videoHeight - cropHeight) / 2
        canvas.width = cropWidth
        canvas.height = cropHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, startX, startY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
        uploadBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85))
      }

      // 2. Call OCR.space API
      const formData = new FormData()
      formData.append('apikey', OCR_SPACE_KEY)
      formData.append('file', uploadBlob, 'scan.jpg')
      formData.append('language', 'vnm')
      formData.append('isOverlayRequired', 'false')
      formData.append('OCREngine', '2') // Engine 2 is best for Vietnamese

      const response = await fetch(OCR_API_URL, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (data.IsErroredOnProcessing) {
        throw new Error(data.ErrorMessage?.[0] || 'Lỗi từ OCR server.')
      }

      if (data.ParsedResults && data.ParsedResults.length > 0) {
        const fullText = data.ParsedResults[0].ParsedText
        if (!fullText || fullText.trim() === "") {
          throw new Error('AI không thấy chữ trong ảnh. Hãy kiểm tra lại góc chụp nhé.')
        }

        const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
        let plateCandidate = lines.find(line => /\d{2}[A-Z]/.test(line)) || lines[0]
        
        let formatted = plateCandidate.toUpperCase().replace(/[^A-Z0-9-]/g, '')
        
        if (formatted.length >= 7 && !formatted.includes('-')) {
          formatted = formatted.slice(0, 3).replace(/(\d{2})([A-Z])/, '$1$2-') + formatted.slice(3)
        }

        // Automatic completion
        setScanResult(formatted)
        setIsScanning(false)

        setTimeout(() => {
          onScan(formatted)
          onClose()
        }, 1200) // Brief delay to show result
      } else {
        throw new Error('AI không thấy chữ trong ảnh. Hãy kiểm tra góc chụp nhé.')
      }
    } catch (err) {
      console.error('OCR API Error:', err)
      setError(err.message || 'Lỗi kết nối bộ não AI.')
      setIsScanning(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <div className="relative aspect-video bg-slate-900 rounded-3xl overflow-hidden border-4 border-slate-800 shadow-inner group">
          {/* Initial State / Mode Selection */}
          {!isCameraMode && !selectedImage && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-slate-900/40 backdrop-blur-sm z-10 transition-all group-hover:bg-slate-900/20">
              <div className="p-4 bg-primary-600/10 rounded-full mb-2">
                <Scan className="w-12 h-12 text-primary-500 animate-pulse" />
              </div>
              <p className="text-white font-bold tracking-tight">Vui lòng chọn nguồn quét</p>
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={startCamera}
                  icon={Camera}
                >
                  Bật Camera
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  icon={RefreshCw}
                >
                  Tải ảnh lên
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 z-20 bg-slate-900">
              <Camera className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">{error}</p>
              <div className="flex gap-3 mt-4">
                <Button variant="secondary" onClick={startCamera}> Thử lại Camera </Button>
                <Button variant="primary" onClick={() => fileInputRef.current?.click()}> Chọn ảnh khác </Button>
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />

          <div className="relative w-full h-full">
            {/* Live Video */}
            {isCameraMode && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}

            {/* Uploaded Image Preview */}
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Selected"
                className="w-full h-full object-contain bg-slate-950"
              />
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Scanning Overlay (during live view) */}
          {stream && isCameraMode && !scanResult && (
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-primary-500 rounded-tl-xl"></div>
              <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-primary-500 rounded-tr-xl"></div>
              <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-primary-500 rounded-bl-xl"></div>
              <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-primary-500 rounded-br-xl"></div>
              <div className={`absolute left-8 right-8 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent shadow-[0_0_15px_rgba(14,165,233,0.8)] ${isScanning ? 'animate-scan-move top-1/2' : 'top-1/2'}`}></div>
            </div>
          )}

          {/* Processing Overlay */}
          {isScanning && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300 z-30">
              <div className="bg-white px-8 py-6 rounded-3xl shadow-2xl flex flex-col items-center space-y-4">
                <div className="relative">
                  <Loader2 className="w-16 h-16 text-primary-600 animate-spin" />
                  <Scan className="absolute inset-0 m-auto w-6 h-6 text-primary-400 opacity-20" />
                </div>
                <div className="text-center">
                  <p className="text-slate-900 font-bold italic">PHÂN TÍCH AI...</p>
                  <p className="text-slate-400 text-xs mt-1">Đang truy vấn Cloud chuyên gia</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Overlay - Auto-Confirming */}
          {scanResult && (
            <div className="absolute inset-0 bg-primary-600/20 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300 z-40">
              <div className="bg-white p-8 rounded-[2rem] shadow-2xl flex flex-col items-center space-y-4 scale-110">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-bounce" />
                <div className="text-center">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Đã nhận diện</p>
                  <h2 className="text-4xl font-black text-slate-950 tracking-tight">{scanResult}</h2>
                </div>
              </div>
            </div>
          )}

          {/* Banner Status */}
          {(stream || selectedImage) && !scanResult && !isScanning && (
            <div className="absolute top-4 left-4 bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 z-20">
              <div className={`w-2 h-2 rounded-full ${stream ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                {stream ? 'Camera Live' : 'Đã tải ảnh lên'}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Button
            variant="secondary"
            className="flex-1 py-4 font-bold"
            onClick={onClose}
            icon={X}
          >
            Đóng
          </Button>

          {(isCameraMode || selectedImage) ? (
            <Button
              className="flex-[2] py-4 font-black uppercase tracking-widest"
              onClick={handleScan}
              loading={isScanning}
              disabled={!!scanResult}
              icon={Scan}
            >
              {isScanning ? 'Đang phân tích...' : 'Bắt đầu quét'}
            </Button>
          ) : (
             <Button
                className="flex-[2] py-4 font-black uppercase tracking-widest"
                onClick={() => fileInputRef.current?.click()}
                icon={RefreshCw}
              >
                Tải ảnh lên
              </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
