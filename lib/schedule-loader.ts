import type { ScheduleData } from './schedule'
import scheduleProd from '@/schedule.json'

/**
 * Returns the active schedule.
 * When USE_DEV_SCHEDULE=true (preview deployments only), loads schedule.dev.json
 * instead. Dynamic import because schedule.dev.json may not exist in all branches.
 */
export async function loadSchedule(): Promise<ScheduleData> {
  if (process.env.USE_DEV_SCHEDULE === 'true') {
    try {
      // @ts-expect-error — schedule.dev.json may not exist in the working tree
      const dev = (await import('@/schedule.dev.json')).default
      return dev as unknown as ScheduleData
    } catch {
      console.warn('USE_DEV_SCHEDULE=true but schedule.dev.json missing; falling back to schedule.json')
    }
  }
  return scheduleProd as unknown as ScheduleData
}
