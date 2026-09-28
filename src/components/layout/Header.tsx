import { useState, useRef, useEffect, useDeferredValue } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Search, X, Users, MessageSquare, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearch, useNotifications, useSettings } from "@/lib/store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";

interface ServerNotification { id: string; type: string; title: string; message: string; link: string; createdAt: string; readAt: string | null; }
interface GlobalSearchResponse { data: { leads: { id:string;name:string;phone:string;status:string }[]; conversations: { id:string;name:string;phone:string;lastMessage:string|null }[]; }; }

export function Header() {
  const navigate = useNavigate();
  const { apiBaseUrl, authHeaders, token, user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const { query, results, setQuery } = useSearch();
  const mockNotifications = useNotifications();
  const apiMode = Boolean(apiBaseUrl && token);
  const [searchFocused, setSearchFocused] = useState(false);
  const deferredQuery=useDeferredValue(query.trim());
  const inputRef = useRef<HTMLInputElement>(null);
  const apiSearch=useQuery({
    queryKey:['global-search',deferredQuery],enabled:apiMode&&searchFocused&&deferredQuery.length>=2,
    queryFn:async()=>{const params=new URLSearchParams({q:deferredQuery});const response=await fetch(`${apiBaseUrl}/search?${params}`,{headers:authHeaders()});if(!response.ok)throw new Error('Search is currently unavailable.');return response.json() as Promise<GlobalSearchResponse>;},
  });
  const apiNotifications = useQuery({
    queryKey: ["api-notifications"], enabled: apiMode, refetchInterval: 30000, staleTime: 15000,
    queryFn: async () => { const response = await fetch(`${apiBaseUrl}/notifications?limit=30`, { headers: authHeaders() }); if (!response.ok) throw new Error("Notifications unavailable"); return response.json() as Promise<{ data: ServerNotification[]; unreadCount: number }>; },
  });
  const readOne = useMutation({ mutationFn: async (id:string) => {const response=await fetch(`${apiBaseUrl}/notifications/${id}/read`,{method:"PATCH",headers:authHeaders()});if(!response.ok)throw new Error("Notification could not be marked read.");}, onSuccess:()=>queryClient.invalidateQueries({queryKey:["api-notifications"]}) });
  const readAll = useMutation({ mutationFn: async () => {const response=await fetch(`${apiBaseUrl}/notifications/read-all`,{method:"POST",headers:authHeaders()});if(!response.ok)throw new Error("Notifications could not be marked read.");}, onSuccess:()=>queryClient.invalidateQueries({queryKey:["api-notifications"]}) });
  const notifications = apiMode ? (apiNotifications.data?.data ?? []).map((notification) => ({ id:notification.id, title:notification.title, message:notification.message, link:notification.link, read:Boolean(notification.readAt), timestamp:new Date(notification.createdAt).toLocaleString(), type:(notification.type.startsWith("whatsapp")?"message":notification.type.startsWith("lead")?"lead":notification.type.startsWith("organization")?"system":"alert") as "lead"|"message"|"system"|"alert" })) : mockNotifications.notifications;
  const unreadCount = apiMode ? (apiNotifications.data?.unreadCount ?? 0) : mockNotifications.unreadCount;
  const markAsRead = (id:string) => { if(apiMode) readOne.mutate(id); else mockNotifications.markAsRead(id); };
  const markAllAsRead = () => { if(apiMode) readAll.mutate(); else mockNotifications.markAllAsRead(); };
  const { settings } = useSettings();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === 'Escape') setSearchFocused(false);
    };
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, []);

  const searchLeads=apiMode?(apiSearch.data?.data.leads??[]):results.leads;
  const searchConversations=apiMode?(apiSearch.data?.data.conversations??[]):results.conversations;
  const handleSearchResultClick = (type: "lead" | "conversation", id: string) => {
    const lead=searchLeads.find((item)=>item.id===id);
    setQuery("");
    setSearchFocused(false);
    if (type === "lead") {
      navigate(`/leads${lead?`?q=${encodeURIComponent(lead.name)}`:''}`);
    } else {
      navigate(`/messages?conversation=${encodeURIComponent(id)}`);
    }
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const showSearchResults = searchFocused && (apiMode?query.trim().length>=2:query.length>0&&(searchLeads.length>0||searchConversations.length>0));

  return (
    <header className="app-header sticky top-0 z-30 flex h-[4.25rem] items-center justify-between gap-4 border-b border-border bg-background/95 px-5 backdrop-blur-sm md:px-8 xl:px-10">
      {/* Search */}
      <div className="relative w-full max-w-[34rem]" ref={searchRef}>
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Find a lead or conversation…"
          className="h-10 rounded-xl border-transparent bg-secondary/75 pl-10 pr-16 text-[13px] shadow-none transition-colors placeholder:text-muted-foreground/75 focus-visible:border-border focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-ring/30"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
        />
        {!query && <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border/70 bg-card px-1.5 py-1 text-[10px] font-medium text-muted-foreground sm:block">Ctrl K</kbd>}
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => setQuery("")}
          >
            <X className="h-3 w-3" />
          </Button>
        )}

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50">
            <ScrollArea className="max-h-80">
              {apiMode&&apiSearch.isFetching&&<p className="px-3 py-2 text-xs text-muted-foreground">Searching CRM…</p>}
              {apiMode&&apiSearch.isError&&<p role="alert" className="px-3 py-2 text-xs text-destructive">CRM search is unavailable.</p>}
              {searchLeads.length > 0 && (
                <div className="p-2">
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1">Leads</p>
                  {searchLeads.slice(0, 5).map((lead) => (
                    <button
                      key={lead.id}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-secondary transition-colors text-left"
                      onClick={() => handleSearchResultClick("lead", lead.id)}
                    >
                      <div className="h-8 w-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                        <Users className="h-4 w-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.phone}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">{lead.status}</Badge>
                    </button>
                  ))}
                </div>
              )}
              {searchConversations.length > 0 && (
                <div className="p-2 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1">Conversations</p>
                  {searchConversations.slice(0, 5).map((conv) => (
                    <button
                      key={conv.id}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-secondary transition-colors text-left"
                      onClick={() => handleSearchResultClick("conversation", conv.id)}
                    >
                      <div className="h-8 w-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{conv.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {apiMode&&!apiSearch.isFetching&&!apiSearch.isError&&searchLeads.length===0&&searchConversations.length===0&&<p className="px-3 py-4 text-center text-xs text-muted-foreground">No CRM records matched that search.</p>}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* System Status */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className={cn("h-2 w-2 rounded-full", apiMode || settings.systemActive ? "bg-success" : "bg-muted-foreground")} />
          <span>{apiMode ? "Workspace live" : settings.systemActive ? "Demo workspace" : "Demo paused"}</span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h4 className="text-sm font-medium">Notifications</h4>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
            </div>
            <ScrollArea className="max-h-80">
              {apiMode && apiNotifications.isError ? (
                <p role="alert" className="px-4 py-8 text-center text-sm text-destructive">Could not load CRM notifications.</p>
              ) : notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No notifications</p>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary transition-colors text-left",
                        !notification.read && "bg-accent/5"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                        notification.type === "lead" && "bg-success/10 text-success",
                        notification.type === "message" && "bg-accent/10 text-accent",
                        notification.type === "system" && "bg-secondary text-muted-foreground",
                        notification.type === "alert" && "bg-warning/10 text-warning"
                      )}>
                        {notification.type === "lead" && <Users className="h-4 w-4" />}
                        {notification.type === "message" && <MessageSquare className="h-4 w-4" />}
                        {notification.type === "system" && <Check className="h-4 w-4" />}
                        {notification.type === "alert" && <Bell className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{notification.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{notification.timestamp}</p>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-accent shrink-0 mt-1.5" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Profile */}
        <Button variant="ghost" size="icon" onClick={apiMode ? signOut : undefined} aria-label={apiMode ? `Sign out ${user?.email ?? ''}` : 'Demo profile'} title={apiMode ? `Sign out ${user?.email ?? ''}` : 'Demo profile'} className="h-9 w-9 rounded-full border border-border bg-card text-xs font-semibold text-foreground">
          {(user?.email?.[0] ?? 'E').toUpperCase()}
        </Button>
      </div>
    </header>
  );
}
