import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createPinia, setActivePinia } from 'pinia'
import PlantForm from '../plants/PlantForm.vue'

const vuetify = createVuetify({ components, directives })

function mountForm(props = {}) {
  return mount(PlantForm, {
    props: { modelValue: true, ...props },
    global: { plugins: [vuetify, createPinia()] },
    attachTo: document.body,
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('PlantForm', () => {
  it('renderuje formularz gdy modelValue=true', () => {
    const wrapper = mountForm()
    expect(document.querySelector('input')).not.toBeNull()
    wrapper.unmount()
  })

  it('domyślnie pokazuje krok wyszukiwania (add mode)', () => {
    const wrapper = mountForm()
    const vm = wrapper.vm as any
    expect(vm.step).toBe('search')
    wrapper.unmount()
  })

  it('przechodzi do custom-form po wywołaniu step = custom-form', async () => {
    const wrapper = mountForm()
    const vm = wrapper.vm as any
    vm.step = 'custom-form'
    await wrapper.vm.$nextTick()
    expect(vm.step).toBe('custom-form')
    expect(vm.isCustom).toBe(true)
    wrapper.unmount()
  })

  it('emituje save z poprawnymi danymi (custom-form)', async () => {
    const wrapper = mountForm()
    const vm = wrapper.vm as any
    vm.step = 'custom-form'
    vm.name = 'Kroton'
    vm.room = 'Salon'
    await wrapper.vm.$nextTick()

    await vm.submit()

    const saved = wrapper.emitted('save')
    expect(saved).toBeTruthy()
    expect((saved as any)[0][0]).toMatchObject({ name: 'Kroton', room: 'Salon' })
    wrapper.unmount()
  })

  it('emituje save bez interwałów gdy template-form', async () => {
    const wrapper = mountForm()
    const vm = wrapper.vm as any
    vm.step = 'template-form'
    vm.name = 'Monstera'
    vm.room = 'Salon'
    vm.wateringIntervalDays = 7
    vm.fertilizingIntervalDays = 14
    await wrapper.vm.$nextTick()

    await vm.submit()

    const saved = wrapper.emitted('save')
    expect(saved).toBeTruthy()
    expect((saved as any)[0][0].wateringIntervalDays).toBeUndefined()
    expect((saved as any)[0][0].fertilizingIntervalDays).toBeUndefined()
    wrapper.unmount()
  })

  it('emituje update:modelValue=false po zapisaniu', async () => {
    const wrapper = mountForm()
    const vm = wrapper.vm as any
    vm.step = 'custom-form'
    vm.name = 'Fikus'
    vm.room = 'Kuchnia'
    await wrapper.vm.$nextTick()

    await vm.submit()

    expect(wrapper.emitted('update:modelValue')?.[0] as any).toEqual([false])
    wrapper.unmount()
  })

  it('wypełnia formularz danymi rośliny przy edycji (bez szablonu → custom-form)', async () => {
    const plant = {
      id: 1,
      name: 'Palma',
      species: 'Chamaedorea',
      room: 'Salon',
      wateringIntervalDays: 5,
      createdAt: new Date(),
    }
    const wrapper = mountForm({ plant })
    const vm = wrapper.vm as any
    expect(vm.step).toBe('custom-form')
    expect(vm.name).toBe('Palma')
    expect(vm.species).toBe('Chamaedorea')
    expect(vm.room).toBe('Salon')
    expect(vm.wateringIntervalDays).toBe(5)
    wrapper.unmount()
  })

  it('przy edycji rośliny z templateSpecies → step = template-form', async () => {
    const plant = {
      id: 2,
      name: 'Monstera',
      species: 'Monstera deliciosa',
      room: 'Salon',
      templateSpecies: 'Monstera deliciosa',
      createdAt: new Date(),
    }
    const wrapper = mountForm({ plant })
    const vm = wrapper.vm as any
    expect(vm.step).toBe('template-form')
    expect(vm.isCustom).toBe(false)
    wrapper.unmount()
  })
})
