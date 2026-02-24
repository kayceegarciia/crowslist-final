"use client";

import { useEffect, useState } from "react";
import { getChat } from "@/actions/chat";
import type { IChat, IMessage } from "@/actions/types";
import { ChatMessages } from "./chat-messages";
import { MessageInput } from "./message-input";

interface IMessageBoxProps {
  chat: IChat;
  userId: string;
}

export function MessageBox({ chat, userId }: IMessageBoxProps) {
  const [messages, setMessages] = useState<IMessage[]>(chat.messages);

  useEffect(() => {
    // Poll for new messages every 3 seconds
    const pollInterval = setInterval(async () => {
      const response = await getChat(chat.id);
      if (response?.success) {
        setMessages(response.success.messages);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [chat.id]);

  return (
    <>
      {/* Chat Messages */}
      <div className="flex-1 max-h-[60dvh] lg:max-h-full overflow-y-auto p-2 border-r border-gray-100 scrollbar-thin">
        <ChatMessages messages={messages} userId={userId} />
      </div>

      {/* Input Bar */}
      <MessageInput
        chatId={chat.id}
        receiverId={
          chat.participants.filter((user) => user.id !== userId)[0].id
        }
      />
    </>
  );
}
