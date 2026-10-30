import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, GlobalAfterChangeHook } from 'payload'

// Services, specialists and appointments: refresh both clinics' homepages and service lists.
export const revalidatePage: CollectionAfterChangeHook = ({ doc, context }) => {
  if (context.disableRevalidate) return doc
  revalidatePath('/[clinic]', 'page')
  revalidatePath('/[clinic]/services', 'page')
  return doc
}

// A clinic's name, contact details or booking rules: every page of every site can show them.
export const revalidateTenant: CollectionAfterChangeHook = ({ doc, context }) => {
  if (context.disableRevalidate) return doc
  revalidatePath('/', 'layout')
  return doc
}

// This is what your Globals (Contact/Header) are looking for
export const revalidateGlobal: GlobalAfterChangeHook = () => {
  revalidatePath('/', 'layout')
  return {}
}
