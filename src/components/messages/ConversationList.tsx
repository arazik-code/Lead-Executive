import { useState } from "react";
import { Search, Filter, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMessages, useLeads } from "@/lib/store";

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "hot">("all");
  const { conversations } = useMessages();
  const { leads } = useLeads();

  // Enrich conversations with lead data
  const enrichedConversations = conversations.map(conv => {
    const lead = leads.find(l => l.id === conv.leadId);
    return {
      ...conv,
      name: lead?.name || conv.name || "Unknown",
      leadScore: lead?.score || conv.leadScore,
    };
  });

  const filteredConversations = enrichedConversations.filter((conv) => {
    const matchesSearch = conv.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    
    switch (filter) {
      case "unread":
        return conv.unread > 0;
      case "hot":
        return conv.leadScore && conv.leadScore >= 80;
      default:
        return true;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success";
      case "pending":
        return "bg-warning";
      default:
        return "bg-muted-foreground";
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "whatsapp":
        return "💬";
      case "email":
        return "📧";
      case "phone":
        return "📞";
      default:
        return "💬";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return "Yesterday";
  };

  return (
    <div className="flex h-full flex-col border-r border-border bg-card/50">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Conversations
          </h2>
          <Badge variant="neon" className="text-xs">
            {enrichedConversations.filter((c) => c.unread > 0).length} New
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-10 bg-secondary border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 mt-3">
          <Button 
            variant={filter === "all" ? "outline" : "ghost"} 
            size="sm" 
            className="text-xs"
            onClick={() => setFilter("all")}
          >
            <Filter className="mr-1 h-3 w-3" />
            All
          </Button>
          <Button 
            variant={filter === "unread" ? "outline" : "ghost"} 
            size="sm" 
            className="text-xs text-muted-foreground"
            onClick={() => setFilter("unread")}
          >
            Unread
          </Button>
          <Button 
            variant={filter === "hot" ? "outline" : "ghost"} 
            size="sm" 
            className="text-xs text-muted-foreground"
            onClick={() => setFilter("hot")}
          >
            Hot Leads
          </Button>
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No conversations found
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelect(conversation.id)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-lg transition-all duration-200 text-left",
                  selectedId === conversation.id
                    ? "bg-accent/10 border border-accent/30"
                    : "hover:bg-secondary border border-transparent"
                )}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-border">
                    <AvatarFallback className="bg-secondary text-foreground font-medium">
                      {conversation.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <Circle
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-4 w-4 fill-current",
                      getStatusColor(conversation.status)
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground truncate">
                      {conversation.name}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {conversation.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {conversation.lastMessage}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs">{getChannelIcon(conversation.channel)}</span>
                    {conversation.leadScore && (
                      <Badge
                        variant={
                          conversation.leadScore >= 80
                            ? "success"
                            : conversation.leadScore >= 60
                            ? "warning"
                            : "secondary"
                        }
                        className="text-[10px] px-1.5 py-0"
                      >
                        {conversation.leadScore}
                      </Badge>
                    )}
                    {conversation.unread > 0 && (
                      <Badge variant="neon" className="text-[10px] px-1.5 py-0 ml-auto">
                        {conversation.unread}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
