export interface SearchEngine {
  inputQuery: string[]
  bodyQuery: string[]
  sidebarContainerQuery: string[]
  appendContainerQuery: string[]
  watchRouteChange?: (callback: () => void) => void
}

export const config: Record<string, SearchEngine> = {
  google : {
    inputQuery: [],
    bodyQuery: ['div[id^=":3"]'],
    // sidebarContainerQuery: ['div[id=":4"]'],
    sidebarContainerQuery: ['table[role="presentation"] > tbody > tr > td:nth-child(2) > div > div'],
    replyButtonContainerQuery: ['table[role="presentation"] > tbody > tr > td:nth-child(2) > div > div > span:nth-child(2)'],
    // #\:f2 > table > tbody > tr > td.amr > div > div
    appendContainerQuery: [],
  }
}

