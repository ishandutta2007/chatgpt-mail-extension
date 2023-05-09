import { GearIcon } from '@primer/octicons-react'
import { useEffect, useState } from 'preact/hooks'
import { memo, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import Browser from 'webextension-polyfill'
import { captureEvent } from '../analytics'
import { Answer } from '../messaging'
import ChatGPTFeedback from './ChatGPTFeedback'
import { isBraveBrowser, shouldShowRatingTip } from './utils.js'
import { render } from 'preact'

export type QueryStatus = 'success' | 'error' | undefined

interface Props {
  question: string
  replyButtonContainer: any
  promptSource: string
  onStatusChange?: (status: QueryStatus) => void
}

interface Requestion {
  requestion: string
  index: number
  answer: Answer | null
}

interface ReQuestionAnswerProps {
  replyText: string | undefined
}


async function mount_summary(summary: string, summaryContainerQuery: string) {
  console.log("summary", summary);
  // const siderbarContainer = getPossibleElementByQuerySelector(summaryContainerQuery)
  const siderbarContainer = document.querySelector('div[aria-label^="Re:"]')
  siderbarContainer.scrollIntoView();
  const container = document.createElement('div')
  container.className = 'chat-gpt-container'
  container.classList.add('gpt-light')
  siderbarContainer.prepend(container)
  render(
    <div>{summary}</div>,    
    container,
  )
}

function ChatGPTQuery(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [done, setDone] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const [status, setStatus] = useState<QueryStatus>()
  const [reError, setReError] = useState('')
  const [reQuestionDone, setReQuestionDone] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(-1)
  const [reQuestionReplyText, setReQuestionReplyText] = useState<string | undefined>()

  useEffect(() => {
    props.onStatusChange?.(status)
  }, [props, status])

  useEffect(() => {
    const port = Browser.runtime.connect()
    const listener = (msg: any) => {
      if (msg.text) {
        setAnswer(msg)
        setStatus('success')
        console.log("answer just set", answer);
      } else if (msg.error) {
        setError(msg.error)
        setStatus('error')
      } else if (msg.event === 'DONE') {
        setDone(true)
        setReQuestionDone(true)
        console.log("answer done set", answer);
      }
    }
    port.onMessage.addListener(listener)
    port.postMessage({ question: props.question })
    return () => {
      port.onMessage.removeListener(listener)
      port.disconnect()
    }
  }, [props.question, retry])

  // retry error on focus
  useEffect(() => {
    const onFocus = () => {
      if (error && (error == 'UNAUTHORIZED' || error === 'CLOUDFLARE')) {
        setError('')
        setRetry((r) => r + 1)
      }
    }
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
    }
  }, [error])

  useEffect(() => {
    shouldShowRatingTip().then((show) => setShowTip(show))
  }, [])

  useEffect(() => {
    if (status === 'success') {
      captureEvent('show_answer', { host: location.host, language: navigator.language })
    }
  }, [props.question, status])

  const openOptionsPage = useCallback(() => {
    Browser.runtime.sendMessage({ type: 'OPEN_OPTIONS_PAGE' })
  }, [questionIndex])

  // requestion
  useEffect(() => {
    const port = Browser.runtime.connect()
    const listener = (msg: any) => {
      try {
        if (msg.text) {
          const replyText = msg?.text
          setReQuestionReplyText(replyText)
          console.log("questionIndex",questionIndex)
          console.log("reQuestionReplyText",reQuestionReplyText)
          console.log("answer later", answer);
        } else if (msg.event === 'DONE') {
          setReQuestionDone(true)
          setQuestionIndex(0)
        }
      } catch {
        setReError(msg.error)
      }
    }
    port.onMessage.addListener(listener)
    port.postMessage({
      question: "Capital of India?",
      conversationId: answer?.conversationId,
      parentMessageId: answer?.messageId,
    })
    return () => {
      port.onMessage.removeListener(listener)
      port.disconnect()
    }
  }, [questionIndex])

  // * Requery Handler Function
  const requeryHandler = useCallback(() => {
    console.log("requeryHandler", inputRef);
    setReQuestionDone(false);
    const requestion = "Capital of India";
    console.log("requeryHandler");
    const replyButtonContainer = props.replyButtonContainer;
    replyButtonContainer.scrollIntoView();
    replyButtonContainer.click();
    function setTextWithDelay() {
      setTimeout(function() {
        const element = document.querySelectorAll('div[aria-label="Message Body"]')[0];
        console.log(element);
        element.textContent = 'New Hello, replies!';
        setQuestionIndex(questionIndex + 1);
        console.log("answer b4 mount", answer);
        mount_summary(answer.text, 'div[aria-label^="Re:"]')
      }, 2000);
    }
    setTextWithDelay();
  }, [ questionIndex])

  const ReQuestionAnswer = ({ replyText }: ReQuestionAnswerProps) => {
    console.log("ReQuestionAnswer replyText:", replyText)
    if (!replyText) {
      return <p className="text-[#b6b8ba] animate-pulse">Answering...</p>
    }
    return (
      <ReactMarkdown rehypePlugins={[[rehypeHighlight, { detect: true }]]}>
        {replyText}
      </ReactMarkdown>
    )
  }

  if (answer) {
    return (
      <div className="markdown-body gpt-markdown" id="gpt-answer" dir="auto">
        <div className="gpt-header">
          <span className="font-bold">MailGPT</span>
          <span className="cursor-pointer leading-[0]" onClick={openOptionsPage}>
            <GearIcon size={14} />
          </span>
          <span className="mx-2 text-base text-gray-500">{`"${props.promptSource}" prompt is used`}</span>
          <ChatGPTFeedback
            messageId={answer.messageId}
            conversationId={answer.conversationId}
            replyText={answer.text}
          />
        </div>
        <ReactMarkdown rehypePlugins={[[rehypeHighlight, { detect: true }]]}>
          {answer.text}
        </ReactMarkdown>

        {done && (
          <form
            id="requestion"
            style={{ display: 'flex' }}
            onSubmit={(e) => {
              // submit when press enter key
              e.preventDefault()
            }}
          >
            <button
              id="submit"
              onClick={requeryHandler}
            >
              Compose with ChatGPT
            </button>
          </form>
        )}
      </div>
    )
  }

  if (error === 'UNAUTHORIZED' || error === 'CLOUDFLARE') {
    return (
      <p>
        Please login and pass Cloudflare check at{' '}
        <a href="https://chat.openai.com" target="_blank" rel="noreferrer">
          chat.openai.com
        </a>
        {retry > 0 &&
          (() => {
            if (isBraveBrowser()) {
              return (
                <span className="block mt-2">
                  Still not working? Follow{' '}
                  <a href="https://github.com/wong2/chat-gpt-google-extension#troubleshooting">
                    Brave Troubleshooting
                  </a>
                </span>
              )
            } else {
              return (
                <span className="italic block mt-2 text-xs">
                  OpenAI requires passing a security check every once in a while. If this keeps
                  happening, change AI provider to OpenAI API in the extension options.
                </span>
              )
            }
          })()}
      </p>
    )
  }
  if (error) {
    return (
      <p>
        Failed to load response from ChatGPT:
        <span className="break-all block">{error}</span>
      </p>
    )
  }

  return <p className="text-[#b6b8ba] animate-pulse">Waiting for ChatGPT summarize...</p>
}

export default memo(ChatGPTQuery)
