import axios from 'axios'

export const sendSmsNotification = async (doc: any) => {
  try {
    await axios.post('https://api.semaphore.co/api/v4/messages', {
      apikey: process.env.SEMAPHORE_API_KEY,
      number: doc.patient.phone,
      message: `Your appointment is confirmed for ${new Date(doc.startTime).toLocaleString()}.`,
    })
  } catch (e) {
    console.error('SMS Failed', e)
  }
}
