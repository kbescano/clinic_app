import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

// Set default timezone to Manila for the whole app
dayjs.tz.setDefault('Asia/Manila')

export default dayjs
