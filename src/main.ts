import * as core from '@actions/core'
import { sendPagerDutyAlert } from './send-pagerduty-alert.ts'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    await sendPagerDutyAlert()
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
