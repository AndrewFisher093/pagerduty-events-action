import got from "got";

import * as core from '@actions/core'

interface PagerDutyEvent {
  routing_key: string
  event_action: 'trigger' | 'acknowledge' | 'resolve'
  dedup_key?: string
  payload: {
    summary: string
    source: string
    severity: 'critical' | 'error' | 'warning' | 'info'
    timestamp?: string
    component?: string
    group?: string
    class?: string
    custom_details?: Record<string, any>
  }
}

export async function sendPagerDutyAlert(): Promise<void> {
  const url = 'https://events.pagerduty.com/v2/enqueue'

  const event: PagerDutyEvent = {
    routing_key: core.getInput('routing_key'),
    event_action: core.getInput('event_action') as 'trigger' | 'acknowledge' | 'resolve',
    payload: {
      summary: core.getInput('summary'),
      source: core.getInput('source'),
      severity: core.getInput('severity') as 'critical' | 'error' | 'warning' | 'info',
      timestamp: core.getInput('timestamp'),
      component: core.getInput('component'),
      group: core.getInput('group'),
      class: core.getInput('class'),
      custom_details: JSON.parse(core.getInput('custom_details') || '{}')
    }
  }

  try {
    const response = await got.post(url, {
      json: event,
      responseType: 'json',
      headers: {
        'Content-Type': 'application/json'
      }
    }) as any;

    core.info(
      `PagerDuty alert sent successfully! ${response.body.message}, dedup_key: ${response.body.dedup_key}. Status Code: ${response.statusCode}`
    )

    core.setOutput('dedup_key', response.body.dedup_key)
    core.setOutput('status_code', response.statusCode)
  } catch (error: any) {
    handleErrorResponse(error)
  }
}

function handleErrorResponse(error: any): void {
  let errorMessage: string | undefined
  let errorBodyContent: string | undefined
  let errorStatusCode: number | undefined

  if (error.response && error.response.body) {
    if (
      Array.isArray(error.response.body.errors) &&
      error.response.body.errors.length > 0
    ) {
      errorBodyContent = error.response.body.errors.join(', ')
    } else {
      errorBodyContent = JSON.stringify(error.response.body)
    }
    errorMessage = error.response.body.message
    errorStatusCode = error.response.statusCode
  }

  if (errorStatusCode !== undefined) {
    core.error(
      `Error! ${errorMessage ? `${errorMessage} - ` : ''}${errorBodyContent || 'No additional details available'}. Status Code: ${errorStatusCode}`
    )
  }

  core.setOutput('status_code', errorStatusCode)
}
