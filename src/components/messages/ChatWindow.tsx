import { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMessages, useLeads } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

interface ChatWindowProps {
  conversationId: string | null;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { conversations, messages, addMessage } = useMessages();
  const { leads } = useLeads();
  const { toast } = useToast();

  const conversation = conversations.find(c => c.id === conversationId);
  const lead = conversation ? leads.find(l => l.id === conversation.leadId) : null;
  const conversationMessages = messages.filter(m => m.conversationId === conversationId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationMessages]);

  const handleSend = () => {
    if (!message.trim() || !conversationId) return;

    addMessage({
      conversationId,
      content: message,
      sender: "user",
      status: "sent",
    });
    setMessage("");
    
    toast({
      title: "Message sent",
      description: "Your message has been delivered.",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (reply: string) => {
    if (!conversationId) return;
    addMessage({
      conversationId,
      content: reply,
      sender: "user",
      status: "sent",
    });
    toast({
      title: "Quick reply sent",
      description: "Your message has been delivered.",
    });
  };

  const handleCall = () => {
    toast({
      title: "Calling lead...",
      description: `Initiating call with ${lead?.name || "lead"}`,
    });
  };

  const handleVideoCall = () => {
    toast({
      title: "Starting video call...",
      description: `Initiating video call with ${lead?.name || "lead"}`,
    });
  };

  if (!conversationId || !conversation) {
    return (
      <div className="flex h-full items-center justify-center bg-card/30">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 border border-accent/20">
            <Send className="h-8 w-8 text-accent" />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            Select a Conversation
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Choose a conversation from the list to start messaging with your leads
          </p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case "read":
        return <CheckCheck className="h-3 w-3 text-accent" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      default:
        return <Check className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getSenderIcon = (sender: string) => {
    switch (sender) {
      case "bot":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 border border-accent/30">
            <Bot className="h-4 w-4 text-accent" />
          </div>
        );
      case "user":
        return (
          <Avatar className="h-8 w-8 border border-border">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              AG
            </AvatarFallback>
          </Avatar>
        );
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex h-full flex-col bg-card/30">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-border bg-card/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-accent/30">
            <AvatarFallback className="bg-secondary text-foreground">
              {lead ? getInitials(lead.name) : "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground">{lead?.name || "Unknown Lead"}</h3>
              {lead && lead.score >= 80 && (
                <Badge variant="success" className="text-[10px]">
                  Hot Lead
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {conversation.status === "online" ? "Online" : conversation.status === "away" ? "Away" : "Offline"} • {conversation.channel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={handleCall}>
                <Phone className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Call Lead</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={handleVideoCall}>
                <Video className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Video Call</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast({ title: "View Profile", description: "Opening lead profile..." })}>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast({ title: "Schedule Meeting", description: "Opening scheduler..." })}>
                Schedule Meeting
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast({ title: "Export Chat", description: "Exporting conversation history..." })}>
                Export Chat History
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => toast({ title: "Archive", description: "Conversation archived." })}>
                Archive Conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {conversationMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.sender === "lead" ? "justify-start" : "justify-end"
              )}
            >
              {msg.sender === "lead" && (
                <Avatar className="h-8 w-8 border border-border shrink-0">
                  <AvatarFallback className="bg-secondary text-foreground text-xs">
                    {lead ? getInitials(lead.name) : "?"}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-3",
                  msg.sender === "lead"
                    ? "bg-secondary text-foreground rounded-tl-sm"
                    : msg.sender === "bot"
                    ? "bg-accent/10 border border-accent/20 text-foreground rounded-tr-sm"
                    : "bg-primary text-primary-foreground rounded-tr-sm"
                )}
              >
                {msg.sender === "bot" && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Bot className="h-3 w-3 text-accent" />
                    <span className="text-[10px] text-accent font-medium">AI Assistant</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <div
                  className={cn(
                    "flex items-center gap-1.5 mt-2",
                    msg.sender === "lead" ? "justify-start" : "justify-end"
                  )}
                >
                  <span className="text-[10px] opacity-60">{formatTimestamp(msg.timestamp)}</span>
                  {msg.sender !== "lead" && getMessageStatusIcon(msg.status)}
                </div>
              </div>
              {msg.sender !== "lead" && getSenderIcon(msg.sender)}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 p-4">
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground shrink-0"
                onClick={() => toast({ title: "Attach File", description: "File attachment coming soon!" })}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Attach File</TooltipContent>
          </Tooltip>
          <div className="relative flex-1">
            <Input
              placeholder="Type your message..."
              className="pr-12 bg-secondary border-border"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
              onClick={() => toast({ title: "Emoji Picker", description: "Emoji picker coming soon!" })}
            >
              <Smile className="h-5 w-5" />
            </Button>
          </div>
          <Button
            variant="neon"
            size="icon"
            className="shrink-0"
            onClick={handleSend}
            disabled={!message.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => handleQuickReply("Thank you for your interest! I'll get back to you shortly.")}
          >
            Quick Reply
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => handleQuickReply("I'd be happy to schedule a property viewing for you. What time works best?")}
          >
            Schedule Viewing
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => handleQuickReply("I'm sending you the detailed property information now. Please let me know if you have any questions!")}
          >
            Send Property Info
          </Button>
        </div>
      </div>
    </div>
  );
}
