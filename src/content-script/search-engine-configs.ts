export interface SearchEngine {
  inputQuery: string[]
  bodyQuery: string[]
  summaryContainerQuery: string[]
  appendContainerQuery: string[]
  watchRouteChange?: (callback: () => void) => void
}

export const config: Record<string, SearchEngine> = {
  google : {
    inputQuery: [],
    bodyQuery: ['div[id^=":3"]'],
    // summaryContainerQuery: ['div[id=":4"]'],
    summaryContainerQuery: ['table[role="presentation"] > tbody > tr > td:nth-child(2) > div > div'],
    summaryContainerLaterQuery: ['div[aria-label^="Re:"]'],
    replyButtonContainerQuery: ['table[role="presentation"] > tbody > tr > td:nth-child(2) > div > div > span:nth-child(2)'],
    // #\:f2 > table > tbody > tr > td.amr > div > div
    appendContainerQuery: [],
  }
}

