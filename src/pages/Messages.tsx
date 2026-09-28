import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ConversationList } from "@/components/messages/ConversationList";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { LeadInfoPanel } from "@/components/messages/LeadInfoPanel";
import { useMessages } from "@/lib/store";

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>("1");
  const { markConversationRead } = useMessages();

  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id);
    markConversationRead(id);
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Conversation List - 320px */}
        <div className="w-80 shrink-0">
          <ConversationList
            selectedId={selectedConversation}
            onSelect={handleSelectConversation}
          />
        </div>

        {/* Chat Window - Flexible */}
        <div className="flex-1 min-w-0">
          <ChatWindow conversationId={selectedConversation} />
        </div>

        {/* Lead Info Panel - 320px */}
        <div className="w-80 shrink-0 hidden xl:block">
          <LeadInfoPanel conversationId={selectedConversation} />
        </div>
      </div>
    </MainLayout>
  );
}
