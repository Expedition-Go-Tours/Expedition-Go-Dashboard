import { useState, useCallback, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { useStepErrors } from '@/features/products/useStepErrors'
import { uploadPhotos } from '@/features/products/api'

export default function Step08Photos() {
  const photos = useProductBuilderStore((s) => s.photos)
  const pendingFiles = useProductBuilderStore((s) => s._pendingFiles)
  const coverPhoto = useProductBuilderStore((s) => s.coverPhoto)
  const copyrightConfirmed = useProductBuilderStore((s) => s.copyrightConfirmed)
  const addPhoto = useProductBuilderStore((s) => s.addPhoto)
  const removePhoto = useProductBuilderStore((s) => s.removePhoto)
  const reorderPhotos = useProductBuilderStore((s) => s.reorderPhotos)
  const setPhotoUrl = useProductBuilderStore((s) => s.setPhotoUrl)
  const setCoverPhoto = useProductBuilderStore((s) => s.setCoverPhoto)
  const setField = useProductBuilderStore((s) => s.setField)
  const errors = useStepErrors(8)

  const [uploading, setUploading] = useState(new Set())
  const [uploadErrors, setUploadErrors] = useState({})
  const dragIndex = useRef(null)
  const blobUrls = useRef({})

  useEffect(() => {
    return () => {
      Object.values(blobUrls.current).forEach(URL.revokeObjectURL)
    }
  }, [])

  const getPreviewUrl = useCallback(
    (photo) => {
      if (photo.url) return photo.url
      const file = pendingFiles[photo.id]
      if (!file) return null
      if (!blobUrls.current[photo.id]) {
        blobUrls.current[photo.id] = URL.createObjectURL(file)
      }
      return blobUrls.current[photo.id]
    },
    [pendingFiles],
  )

  const uploadFile = useCallback(async (id, file) => {
    setUploading((prev) => new Set(prev).add(id))
    setUploadErrors((prev) => { const n = { ...prev }; delete n[id]; return n })
    try {
      const formData = new FormData()
      formData.append('photos', file)
      const res = await uploadPhotos(formData)
      const urls = res.data?.data?.photos || []
      if (urls.length > 0) {
        setPhotoUrl(id, urls[0])
        if (!coverPhoto) setCoverPhoto(urls[0])
      }
    } catch (err) {
      setUploadErrors((prev) => ({ ...prev, [id]: err.response?.data?.message || 'Upload failed' }))
    } finally {
      setUploading((prev) => {
        const n = new Set(prev)
        n.delete(id)
        return n
      })
    }
  }, [setPhotoUrl, setCoverPhoto, coverPhoto])

  const onDrop = useCallback(
    (acceptedFiles) => {
      for (const file of acceptedFiles) {
        const id = crypto.randomUUID()
        addPhoto(id, file)
        uploadFile(id, file)
      }
    },
    [addPhoto, uploadFile],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxSize: 10 * 1024 * 1024,
  })

  const handleRemove = (index) => {
    const photo = photos[index]
    if (blobUrls.current[photo.id]) {
      URL.revokeObjectURL(blobUrls.current[photo.id])
      delete blobUrls.current[photo.id]
    }
    if (photo.url && coverPhoto === photo.url) {
      setCoverPhoto('')
    }
    removePhoto(index)
  }

  return (
    <div className="max-w-[720px]">
      <label className="block text-sm font-semibold mb-2 text-slate-800">Upload photos (at least 7)</label>
      <p className="text-[13px] text-slate-500 mb-4 leading-relaxed">
        Landscape format, 4:3 ratio, min 1280×960px. JPG or PNG. Color photos only. Drag photos to reorder.
      </p>

      {errors.photos && <span className="text-[13px] text-red-600 font-medium mt-1 flex items-center gap-1">{errors.photos[0]}</span>}

      <div
        {...getRootProps()}
        className={`border-2 border-dashed border-slate-300 rounded-2xl py-10 px-5 text-center cursor-pointer transition-all bg-slate-50 hover:border-emerald-500 hover:bg-emerald-50/5 mb-4 ${
          isDragActive ? 'border-emerald-500 bg-emerald-50/5' : ''
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-sm text-slate-500">Drop photos here...</p>
        ) : (
          <p className="text-sm text-slate-500">Drag & drop photos, or click to select</p>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {photos.map((photo, i) => {
          const src = getPreviewUrl(photo)
          const isUploaded = !!photo.url
          const isCover = isUploaded && coverPhoto === photo.url
          const isUploading = uploading.has(photo.id)
          const error = uploadErrors[photo.id]
          const isPending = !isUploaded && !isUploading && !error && !!pendingFiles[photo.id]

          return (
            <div
              key={photo.id}
              className={`relative aspect-[4/3] rounded-xl overflow-hidden border transition-all ${
                isCover ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-slate-200'
              } ${isUploading || isPending ? 'opacity-80' : ''} ${error ? 'border-red-400' : ''}`}
              draggable={!isUploading}
              onDragStart={() => { dragIndex.current = i }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex.current !== null && dragIndex.current !== i) {
                  reorderPhotos(dragIndex.current, i)
                  dragIndex.current = null
                }
              }}
            >
              {src ? (
                <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-100 grid place-items-center text-slate-400 text-sm">
                  No preview
                </div>
              )}

              {isCover && (
                <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Cover
                </span>
              )}

              {isUploaded && !isCover && (
                <button
                  className="absolute top-1.5 left-1.5 bg-white/80 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border-0 cursor-pointer hover:bg-white"
                  onClick={() => setCoverPhoto(photo.url)}
                  type="button"
                >
                  Set as cover
                </button>
              )}

              <button
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full border-0 bg-black/60 text-white cursor-pointer grid place-items-center text-xs hover:bg-black/80"
                onClick={() => handleRemove(i)}
                type="button"
              >
                ✕
              </button>

              <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                {i + 1}
              </span>

              {isUploading && (
                <div className="absolute inset-0 bg-black/20 grid place-items-center">
                  <span className="text-white text-[11px] font-semibold bg-black/60 px-2 py-1 rounded-full flex items-center gap-1">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Uploading
                  </span>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 bg-red-500/10 grid place-items-center">
                  <button
                    className="text-white text-[11px] font-semibold bg-red-600 px-2 py-1 rounded-full border-0 cursor-pointer hover:bg-red-700"
                    onClick={() => {
                      const file = pendingFiles[photo.id]
                      if (file) uploadFile(photo.id, file)
                    }}
                    type="button"
                  >
                    Retry upload
                  </button>
                </div>
              )}

              {isPending && (
                <div className="absolute inset-0 bg-black/20 grid place-items-center pointer-events-none">
                  <span className="text-white text-[11px] font-semibold bg-black/60 px-2 py-1 rounded-full">
                    Queued
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-sm mt-4">
        <input
          type="checkbox"
          checked={copyrightConfirmed}
          onChange={(e) => setField('copyrightConfirmed', e.target.checked)}
          className="w-[18px] h-[18px] cursor-pointer"
        />
        <span>I confirm that I own the copyright for all uploaded photos</span>
      </label>
      {errors.copyrightConfirmed && <span className="text-[13px] text-red-600 font-medium mt-1 flex items-center gap-1">{errors.copyrightConfirmed[0]}</span>}
    </div>
  )
}
