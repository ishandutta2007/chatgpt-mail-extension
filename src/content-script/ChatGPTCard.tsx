import { SearchIcon } from '@primer/octicons-react'
import { useState } from 'preact/hooks'
import { TriggerMode } from '../config'
import ChatGPTQuery, { QueryStatus } from './ChatGPTQuery'

interface Props {
  question: string
  replyButtonContainer: any
  promptSource: string
  triggerMode: TriggerMode
  onStatusChange?: (status: QueryStatus) => void
}

function ChatGPTCard(props: Props) {
  const [triggered, setTriggered] = useState(false)

  if (props.triggerMode === TriggerMode.Always) {
    return <ChatGPTQuery {...props} />
  }
  if (triggered) {
    return <ChatGPTQuery {...props} />
  }
  return (
    <p className="icon-and-text cursor-pointer" onClick={() => setTriggered(true)}>
      <SearchIcon size="small" /> Ask MailGPT to summarize
    </p>
  )
}

export default ChatGPTCard
