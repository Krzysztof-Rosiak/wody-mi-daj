import { ref } from 'vue'

const MAX_SIZE = 800   // px — longer side
const QUALITY = 0.82   // JPEG quality

export function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const { width, height } = img
      const scale = Math.min(1, MAX_SIZE / Math.max(width, height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas context unavailable'))
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', QUALITY))
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = dataUrl
  })
}

export function useImageUpload(initialImage?: string) {
  const imageBase64 = ref<string | undefined>(initialImage)
  const imagePreview = ref<string | undefined>(initialImage)
  const fileInput = ref<HTMLInputElement | null>(null)
  const compressing = ref(false)

  async function processFile(file: File) {
    compressing.value = true
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const raw = e.target?.result as string
        const compressed = await compressImage(raw)
        imageBase64.value = compressed
        imagePreview.value = compressed
      } finally {
        compressing.value = false
      }
    }
    reader.onerror = () => { compressing.value = false }
    reader.readAsDataURL(file)
  }

  async function handleFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    await processFile(file)
  }

  async function handleFileDrop(event: DragEvent) {
    const file = event.dataTransfer?.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    await processFile(file)
  }

  function removeImage() {
    imageBase64.value = undefined
    imagePreview.value = undefined
    if (fileInput.value) fileInput.value.value = ''
  }

  function setImage(src: string | undefined) {
    imageBase64.value = src
    imagePreview.value = src
  }

  return { imageBase64, imagePreview, fileInput, compressing, handleFileChange, handleFileDrop, removeImage, setImage }
}
