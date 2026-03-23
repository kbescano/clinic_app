import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, GlobalAfterChangeHook } from 'payload'

// This is what the Services collection is looking for
export const revalidatePage: CollectionAfterChangeHook = ({ doc }) => {
  revalidatePath('/')
  if (doc.slug) {
    revalidatePath(`/${doc.slug}`)
  }
  return doc
}

// This is what your Globals (Contact/Header) are looking for
export const revalidateGlobal: GlobalAfterChangeHook = () => {
  revalidatePath('/', 'layout')
  return {}
}
