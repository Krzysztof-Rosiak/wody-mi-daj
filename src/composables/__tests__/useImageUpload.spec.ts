import { describe, it, expect, vi, afterEach } from 'vitest'
import { useImageUpload } from '../useImageUpload'

// ─── Mocks for canvas + Image + FileReader ───────────────────────────────────────

const COMPRESSED = 'data:image/jpeg;base64,COMPRESSED'

function mockBrowserApis(rawDataUrl: string) {
  // Image — calls onload immediately
  class MockImage {
    width = 1600
    height = 1200
    set src(_: string) { setTimeout(() => (this as any).onload?.(), 0) }
  }
  vi.stubGlobal('Image', MockImage)

  // Canvas — toDataURL returns a fixed result
  const mockCtx = { drawImage: vi.fn() }
  const mockCanvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => mockCtx),
    toDataURL: vi.fn(() => COMPRESSED),
  }
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement
    return document.createElement(tag)
  })

  // FileReader — calls onload immediately with rawDataUrl
  class MockFileReader {
    onerror: (() => void) | null = null
    private _onload: ((e: any) => void) | null = null
    set onload(fn: (e: any) => void) { this._onload = fn }
    readAsDataURL(_: File) {
      setTimeout(() => this._onload?.({ target: { result: rawDataUrl } }), 0)
    }
  }
  vi.stubGlobal('FileReader', MockFileReader)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useImageUpload', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })
  // ─── initialization ──────────────────────────────────────────────────────────

  it('imageBase64 i imagePreview są undefined bez initialImage', () => {
    const { imageBase64, imagePreview } = useImageUpload()
    expect(imageBase64.value).toBeUndefined()
    expect(imagePreview.value).toBeUndefined()
  })

  it('inicjalizuje z podanym obrazem', () => {
    const src = 'data:image/png;base64,abc'
    const { imageBase64, imagePreview } = useImageUpload(src)
    expect(imageBase64.value).toBe(src)
    expect(imagePreview.value).toBe(src)
  })

  it('compressing startuje jako false', () => {
    const { compressing } = useImageUpload()
    expect(compressing.value).toBe(false)
  })

  // ─── setImage ───────────────────────────────────────────────────────────────

  it('setImage ustawia imageBase64 i imagePreview', () => {
    const { imageBase64, imagePreview, setImage } = useImageUpload()
    setImage('data:image/jpeg;base64,xyz')
    expect(imageBase64.value).toBe('data:image/jpeg;base64,xyz')
    expect(imagePreview.value).toBe('data:image/jpeg;base64,xyz')
  })

  it('setImage z undefined czyści obraz', () => {
    const { imageBase64, imagePreview, setImage } = useImageUpload('data:image/png;base64,abc')
    setImage(undefined)
    expect(imageBase64.value).toBeUndefined()
    expect(imagePreview.value).toBeUndefined()
  })

  // ─── removeImage ────────────────────────────────────────────────────────────

  it('removeImage czyści imageBase64 i imagePreview', () => {
    const { imageBase64, imagePreview, removeImage } = useImageUpload('data:image/png;base64,abc')
    removeImage()
    expect(imageBase64.value).toBeUndefined()
    expect(imagePreview.value).toBeUndefined()
  })

  it('removeImage resetuje wartość fileInput', () => {
    const { fileInput, removeImage } = useImageUpload()
    const input = document.createElement('input')
    input.value = 'some-file.jpg'
    fileInput.value = input
    removeImage()
    expect(input.value).toBe('')
  })

  it('removeImage nie rzuca błędu gdy fileInput=null', () => {
    const { removeImage } = useImageUpload()
    expect(() => removeImage()).not.toThrow()
  })

  // ─── handleFileChange ───────────────────────────────────────────────────────

  it('handleFileChange ignoruje event bez pliku', async () => {
    const { imageBase64, handleFileChange } = useImageUpload()
    const event = { target: { files: [] } } as unknown as Event
    await handleFileChange(event)
    expect(imageBase64.value).toBeUndefined()
  })

  it('handleFileChange kompresuje obraz i ustawia wynik', async () => {
    mockBrowserApis('data:image/png;base64,RAW')

    const { imageBase64, imagePreview, handleFileChange } = useImageUpload()
    const file = new File(['x'], 'photo.png', { type: 'image/png' })
    const event = { target: { files: [file] } } as unknown as Event

    await handleFileChange(event)
    await new Promise((r) => setTimeout(r, 50))

    expect(imageBase64.value).toBe(COMPRESSED)
    expect(imagePreview.value).toBe(COMPRESSED)
  })

  it('handleFileChange ustawia compressing=false po zakończeniu', async () => {
    mockBrowserApis('data:image/png;base64,RAW')

    const { compressing, handleFileChange } = useImageUpload()
    const file = new File(['x'], 'photo.png', { type: 'image/png' })
    const event = { target: { files: [file] } } as unknown as Event

    await handleFileChange(event)
    await new Promise((r) => setTimeout(r, 50))

    expect(compressing.value).toBe(false)
  })
})
