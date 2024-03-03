import React, {
  useState,
} from 'react';
import {
  useAppDispatch,
} from '../../lib/hooks';
import {
  startWaitingForResponse,
  stopWaitingForResponse,
} from '../../lib/store';
import {
  cn,
} from '../../lib/utils';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';

const Chat = ({ selectedDirectory }: { selectedDirectory: string | null; }) => {
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string | null; }[]>([]);
  const dispatch = useAppDispatch();
  const sendMessage = async (message: string) => {
    try {
      if (chatHistory.length === 0) {
        window.electronAPI.resizeWindow(500);
      }
      const newHistory = [
        ...chatHistory,
        { role: 'user', content: message },
      ];
      setChatHistory(newHistory);
      dispatch(startWaitingForResponse());
      const response = await fetch('http://localhost:8080/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: selectedDirectory ? [{ role: 'user', content: message }] : newHistory,
          temperature: 1.0,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          max_tokens: 256,
          directory: selectedDirectory,
        }),
      });
      dispatch(stopWaitingForResponse());

      const responseData = await response.json();
      const assistantResponse = responseData.choices[0].message.content;

      setChatHistory([
        ...newHistory,
        { role: 'assistant', content: assistantResponse },
      ]);
    } catch (error) {
      dispatch(stopWaitingForResponse());
      // eslint-disable-next-line no-console
      console.error('Error sending message: ', error);
    }
  };

  return (
    <>
      <div
        className={cn('flex justify-center border-b-neutral-400 dark:border-b-neutral-700', {
          'border-b': chatHistory.length > 0,
        })}
      >
        <ChatInput sendMessage={sendMessage} />
      </div>
      <div
        className={cn(
          'flex-grow min-w-full border-0 flex h-0',
          {
            'h-[400px]': chatHistory.length > 0,
          },
        )}
      >
        <ChatMessages chatHistory={chatHistory} />
      </div>
    </>
  );
};

export default Chat;
