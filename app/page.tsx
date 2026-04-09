// app/page.tsx
import scheduleData from '@/schedule.json'
import type { ScheduleData } from '@/lib/schedule'
import ClientPage from './client-page'

// Type assertion — schedule.json matches ScheduleData shape
const schedule = scheduleData as ScheduleData

export default function Page() {
  return <ClientPage schedule={schedule} />
}
