import React, { createContext, useContext, useReducer, ReactNode } from "react";

// ============ Types ============

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  budget: string;
  intent: "High" | "Medium" | "Low";
  timeline: string;
  propertyType: string;
  score: number;
  status: "New" | "Qualifying" | "Qualified" | "Routed";
  assignedTo: string;
  createdAt: string;
  source: string;
  notes?: string;
  questionsAnswered: number;
  totalQuestions: number;
}

export interface Agent {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  status: "available" | "busy" | "offline";
  specialty: string[];
  activeLeads: number;
  maxLeads: number;
  rating: number;
  conversionRate: number;
  responseTime: string;
  totalDeals: number;
  region: string;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  sender: "user" | "lead" | "bot";
  timestamp: string;
  status: "sent" | "delivered" | "read";
}

export interface Conversation {
  id: string;
  leadId: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  status: "online" | "offline" | "away";
  leadScore?: number;
  channel: "whatsapp" | "email" | "phone";
}

export interface Question {
  id: string;
  question: string;
  type: "single" | "multiple" | "text" | "scale";
  options?: string[];
  weight: number;
  required: boolean;
  enabled: boolean;
  category: string;
}

export interface RoutingRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    type: string;
    operator: string;
    value: string;
  }[];
  action: {
    type: "assign" | "queue" | "rotate";
    target: string;
  };
  priority: number;
  enabled: boolean;
  matchCount: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "lead" | "message" | "system" | "alert";
  read: boolean;
  timestamp: string;
  link?: string;
}

export interface Settings {
  systemActive: boolean;
  pilotDuration: number;
  whatsappEntry: string;
  highSignalThreshold: number;
  mediumSignalMin: number;
  mediumSignalMax: number;
  notifications: {
    newLeadAlerts: boolean;
    highSignalAlerts: boolean;
    dailySummary: boolean;
    milestoneAlerts: boolean;
  };
}

// ============ Initial Data ============

const initialLeads: Lead[] = [
  {
    id: "1",
    name: "Ahmed Hassan",
    phone: "+971 50 123 4567",
    email: "ahmed.h@email.com",
    budget: "AED 2.5M - 3.5M",
    intent: "High",
    timeline: "1-2 months",
    propertyType: "Villa",
    score: 92,
    status: "Qualified",
    assignedTo: "Senior Broker A",
    createdAt: "2024-01-03 10:15",
    source: "WhatsApp",
    questionsAnswered: 5,
    totalQuestions: 5,
  },
  {
    id: "2",
    name: "Sarah Ali",
    phone: "+971 55 987 6543",
    email: "sarah.a@email.com",
    budget: "AED 1.2M - 1.8M",
    intent: "Medium",
    timeline: "3-6 months",
    propertyType: "Apartment",
    score: 68,
    status: "Routed",
    assignedTo: "Junior Team",
    createdAt: "2024-01-03 09:45",
    source: "WhatsApp",
    questionsAnswered: 5,
    totalQuestions: 5,
  },
  {
    id: "3",
    name: "Omar Khalid",
    phone: "+971 56 456 7890",
    email: "omar.k@email.com",
    budget: "AED 5M+",
    intent: "High",
    timeline: "Immediate",
    propertyType: "Penthouse",
    score: 95,
    status: "Qualified",
    assignedTo: "Senior Broker B",
    createdAt: "2024-01-03 09:30",
    source: "WhatsApp",
    questionsAnswered: 5,
    totalQuestions: 5,
  },
  {
    id: "4",
    name: "Fatima Noor",
    phone: "+971 50 222 3333",
    email: "fatima.n@email.com",
    budget: "AED 800K - 1M",
    intent: "Low",
    timeline: "6+ months",
    propertyType: "Studio",
    score: 35,
    status: "Qualifying",
    assignedTo: "Nurture Queue",
    createdAt: "2024-01-03 09:00",
    source: "WhatsApp",
    questionsAnswered: 3,
    totalQuestions: 5,
  },
  {
    id: "5",
    name: "Mohammed Yusuf",
    phone: "+971 55 444 5555",
    email: "mohammed.y@email.com",
    budget: "TBD",
    intent: "Medium",
    timeline: "TBD",
    propertyType: "TBD",
    score: 45,
    status: "New",
    assignedTo: "Unassigned",
    createdAt: "2024-01-03 08:45",
    source: "WhatsApp",
    questionsAnswered: 0,
    totalQuestions: 5,
  },
  {
    id: "6",
    name: "Layla Ahmed",
    phone: "+971 56 666 7777",
    email: "layla.a@email.com",
    budget: "AED 1.5M - 2M",
    intent: "Medium",
    timeline: "3-6 months",
    propertyType: "Apartment",
    score: 62,
    status: "Qualifying",
    assignedTo: "Pending",
    createdAt: "2024-01-03 08:30",
    source: "WhatsApp",
    questionsAnswered: 3,
    totalQuestions: 5,
  },
];

const initialAgents: Agent[] = [
  {
    id: "1",
    name: "Sarah Mitchell",
    role: "Senior Agent",
    status: "available",
    specialty: ["Luxury Homes", "Downtown"],
    activeLeads: 8,
    maxLeads: 15,
    rating: 4.9,
    conversionRate: 34,
    responseTime: "5m",
    totalDeals: 156,
    region: "Dubai Marina",
  },
  {
    id: "2",
    name: "James Rodriguez",
    role: "Agent",
    status: "busy",
    specialty: ["First-Time Buyers", "Condos"],
    activeLeads: 12,
    maxLeads: 12,
    rating: 4.7,
    conversionRate: 28,
    responseTime: "8m",
    totalDeals: 89,
    region: "Downtown Dubai",
  },
  {
    id: "3",
    name: "Emily Chen",
    role: "Senior Agent",
    status: "available",
    specialty: ["Investment Properties", "Multi-Family"],
    activeLeads: 6,
    maxLeads: 15,
    rating: 4.8,
    conversionRate: 31,
    responseTime: "4m",
    totalDeals: 134,
    region: "Palm Jumeirah",
  },
];

const initialConversations: Conversation[] = [
  {
    id: "1",
    leadId: "1",
    name: "Ahmed Hassan",
    lastMessage: "I'm interested in the Villa property...",
    timestamp: "2 min ago",
    unread: 3,
    status: "online",
    leadScore: 92,
    channel: "whatsapp",
  },
  {
    id: "2",
    leadId: "2",
    name: "Sarah Ali",
    lastMessage: "What's the price range for apartments?",
    timestamp: "15 min ago",
    unread: 1,
    status: "online",
    leadScore: 68,
    channel: "whatsapp",
  },
  {
    id: "3",
    leadId: "3",
    name: "Omar Khalid",
    lastMessage: "Can we schedule a viewing for Saturday?",
    timestamp: "1 hour ago",
    unread: 0,
    status: "away",
    leadScore: 95,
    channel: "email",
  },
];

const initialMessages: Message[] = [
  {
    id: "1",
    conversationId: "1",
    content: "Hi! I saw your listing for the 3-bedroom Villa in Dubai Marina. Is it still available?",
    sender: "lead",
    timestamp: "10:30 AM",
    status: "read",
  },
  {
    id: "2",
    conversationId: "1",
    content: "Hello Ahmed! Yes, the property is still available. It's a beautiful 3-bedroom villa with a private pool.",
    sender: "bot",
    timestamp: "10:31 AM",
    status: "read",
  },
  {
    id: "3",
    conversationId: "1",
    content: "That sounds great! What's the asking price?",
    sender: "lead",
    timestamp: "10:32 AM",
    status: "read",
  },
  {
    id: "4",
    conversationId: "1",
    content: "The asking price is AED 3.2M. Would you like me to schedule a viewing?",
    sender: "bot",
    timestamp: "10:33 AM",
    status: "read",
  },
];

const initialQuestions: Question[] = [
  {
    id: "1",
    question: "What is your budget range for this property?",
    type: "single",
    options: ["Under AED 500K", "AED 500K-1M", "AED 1M-2M", "AED 2M-5M", "Over AED 5M"],
    weight: 25,
    required: true,
    enabled: true,
    category: "Budget",
  },
  {
    id: "2",
    question: "When are you looking to make a purchase?",
    type: "single",
    options: ["Immediately", "Within 30 days", "1-3 months", "3-6 months", "Just browsing"],
    weight: 20,
    required: true,
    enabled: true,
    category: "Timeline",
  },
  {
    id: "3",
    question: "Are you pre-approved for a mortgage?",
    type: "single",
    options: ["Yes, fully pre-approved", "In the process", "Not yet", "Paying cash"],
    weight: 20,
    required: true,
    enabled: true,
    category: "Financing",
  },
  {
    id: "4",
    question: "What type of property are you interested in?",
    type: "multiple",
    options: ["Villa", "Apartment", "Penthouse", "Townhouse", "Studio"],
    weight: 15,
    required: true,
    enabled: true,
    category: "Property Type",
  },
  {
    id: "5",
    question: "Which areas are you considering?",
    type: "text",
    weight: 10,
    required: false,
    enabled: true,
    category: "Location",
  },
  {
    id: "6",
    question: "How many bedrooms do you need?",
    type: "single",
    options: ["Studio", "1-2", "3", "4", "5+"],
    weight: 10,
    required: true,
    enabled: true,
    category: "Requirements",
  },
];

const initialRoutingRules: RoutingRule[] = [
  {
    id: "1",
    name: "High-Value Hot Leads",
    description: "Route leads with budget >AED 2M and score >85 to senior agents",
    conditions: [
      { type: "Budget", operator: "greater than", value: "AED 2,000,000" },
      { type: "Lead Score", operator: "greater than", value: "85" },
    ],
    action: { type: "assign", target: "Senior Agent Pool" },
    priority: 1,
    enabled: true,
    matchCount: 45,
  },
  {
    id: "2",
    name: "Dubai Marina Specialists",
    description: "Route Dubai Marina property inquiries to specialized agents",
    conditions: [{ type: "Location", operator: "equals", value: "Dubai Marina" }],
    action: { type: "assign", target: "Marina Team" },
    priority: 2,
    enabled: true,
    matchCount: 128,
  },
  {
    id: "3",
    name: "First-Time Buyer Support",
    description: "Route first-time buyers to patient, experienced agents",
    conditions: [{ type: "Experience", operator: "equals", value: "First-time buyer" }],
    action: { type: "rotate", target: "First-Time Buyer Specialists" },
    priority: 3,
    enabled: true,
    matchCount: 89,
  },
  {
    id: "4",
    name: "Immediate Needs",
    description: "Fast-track leads looking to buy immediately",
    conditions: [{ type: "Timeline", operator: "equals", value: "Immediately" }],
    action: { type: "queue", target: "Priority Queue" },
    priority: 4,
    enabled: true,
    matchCount: 34,
  },
];

const initialNotifications: Notification[] = [
  {
    id: "1",
    title: "New High-Value Lead",
    message: "Ahmed Hassan (Score: 92) just inquired about a Villa",
    type: "lead",
    read: false,
    timestamp: "2 min ago",
    link: "/leads",
  },
  {
    id: "2",
    title: "New Message",
    message: "Sarah Ali sent a new message",
    type: "message",
    read: false,
    timestamp: "15 min ago",
    link: "/messages",
  },
  {
    id: "3",
    title: "Lead Qualified",
    message: "Omar Khalid has been qualified and routed",
    type: "system",
    read: false,
    timestamp: "1 hour ago",
    link: "/pipeline",
  },
];

const initialSettings: Settings = {
  systemActive: true,
  pilotDuration: 14,
  whatsappEntry: "+971 4 XXX XXXX",
  highSignalThreshold: 80,
  mediumSignalMin: 50,
  mediumSignalMax: 79,
  notifications: {
    newLeadAlerts: true,
    highSignalAlerts: true,
    dailySummary: true,
    milestoneAlerts: false,
  },
};

// ============ State & Actions ============

interface AppState {
  leads: Lead[];
  agents: Agent[];
  conversations: Conversation[];
  messages: Message[];
  questions: Question[];
  routingRules: RoutingRule[];
  notifications: Notification[];
  settings: Settings;
  searchQuery: string;
  searchResults: { leads: Lead[]; conversations: Conversation[] };
}

type Action =
  | { type: "ADD_LEAD"; payload: Lead }
  | { type: "UPDATE_LEAD"; payload: Lead }
  | { type: "PATCH_LEAD"; payload: { id: string; updates: Partial<Lead> } }
  | { type: "DELETE_LEAD"; payload: string }
  | { type: "UPDATE_LEAD_STATUS"; payload: { id: string; status: Lead["status"] } }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "MARK_CONVERSATION_READ"; payload: string }
  | { type: "UPDATE_QUESTION"; payload: Question }
  | { type: "ADD_QUESTION"; payload: Question }
  | { type: "DELETE_QUESTION"; payload: string }
  | { type: "TOGGLE_QUESTION"; payload: string }
  | { type: "UPDATE_ROUTING_RULE"; payload: RoutingRule }
  | { type: "ADD_ROUTING_RULE"; payload: RoutingRule }
  | { type: "DELETE_ROUTING_RULE"; payload: string }
  | { type: "TOGGLE_ROUTING_RULE"; payload: string }
  | { type: "UPDATE_SETTINGS"; payload: Partial<Settings> }
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "MARK_NOTIFICATION_READ"; payload: string }
  | { type: "MARK_ALL_NOTIFICATIONS_READ" }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "UPDATE_AGENT"; payload: Agent };

const initialState: AppState = {
  leads: initialLeads,
  agents: initialAgents,
  conversations: initialConversations,
  messages: initialMessages,
  questions: initialQuestions,
  routingRules: initialRoutingRules,
  notifications: initialNotifications,
  settings: initialSettings,
  searchQuery: "",
  searchResults: { leads: [], conversations: [] },
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ADD_LEAD":
      return { ...state, leads: [action.payload, ...state.leads] };

    case "UPDATE_LEAD":
      return {
        ...state,
        leads: state.leads.map((l) => (l.id === action.payload.id ? action.payload : l)),
      };

    case "PATCH_LEAD":
      return {
        ...state,
        leads: state.leads.map((lead) => lead.id === action.payload.id ? { ...lead, ...action.payload.updates } : lead),
      };

    case "DELETE_LEAD":
      return {
        ...state,
        leads: state.leads.filter((l) => l.id !== action.payload),
      };

    case "UPDATE_LEAD_STATUS":
      return {
        ...state,
        leads: state.leads.map((l) =>
          l.id === action.payload.id ? { ...l, status: action.payload.status } : l
        ),
      };

    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
        conversations: state.conversations.map((c) =>
          c.id === action.payload.conversationId
            ? { ...c, lastMessage: action.payload.content, timestamp: "Just now" }
            : c
        ),
      };

    case "MARK_CONVERSATION_READ":
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.payload ? { ...c, unread: 0 } : c
        ),
      };

    case "ADD_QUESTION":
      return { ...state, questions: [...state.questions, action.payload] };

    case "UPDATE_QUESTION":
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === action.payload.id ? action.payload : q
        ),
      };

    case "DELETE_QUESTION":
      return {
        ...state,
        questions: state.questions.filter((q) => q.id !== action.payload),
      };

    case "TOGGLE_QUESTION":
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === action.payload ? { ...q, enabled: !q.enabled } : q
        ),
      };

    case "ADD_ROUTING_RULE":
      return { ...state, routingRules: [...state.routingRules, action.payload] };

    case "UPDATE_ROUTING_RULE":
      return {
        ...state,
        routingRules: state.routingRules.map((r) =>
          r.id === action.payload.id ? action.payload : r
        ),
      };

    case "DELETE_ROUTING_RULE":
      return {
        ...state,
        routingRules: state.routingRules.filter((r) => r.id !== action.payload),
      };

    case "TOGGLE_ROUTING_RULE":
      return {
        ...state,
        routingRules: state.routingRules.map((r) =>
          r.id === action.payload ? { ...r, enabled: !r.enabled } : r
        ),
      };

    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };

    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };

    case "MARK_ALL_NOTIFICATIONS_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };

    case "SET_SEARCH_QUERY": {
      const query = action.payload.toLowerCase();
      return {
        ...state,
        searchQuery: action.payload,
        searchResults: {
          leads: query
            ? state.leads.filter(
                (l) =>
                  l.name.toLowerCase().includes(query) ||
                  l.phone.includes(query) ||
                  l.email?.toLowerCase().includes(query)
              )
            : [],
          conversations: query
            ? state.conversations.filter(
                (c) =>
                  c.name.toLowerCase().includes(query) ||
                  c.lastMessage.toLowerCase().includes(query)
              )
            : [],
        },
      };
    }

    case "UPDATE_AGENT":
      return {
        ...state,
        agents: state.agents.map((a) => (a.id === action.payload.id ? action.payload : a)),
      };

    default:
      return state;
  }
}

// ============ Context ============

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

// Helper hooks
export function useLeads() {
  const { state, dispatch } = useApp();
  return {
    leads: state.leads,
    addLead: (lead: Lead) => dispatch({ type: "ADD_LEAD", payload: lead }),
    updateLead: (id: string, updates: Partial<Lead>) => dispatch({ type: "PATCH_LEAD", payload: { id, updates } }),
    deleteLead: (id: string) => dispatch({ type: "DELETE_LEAD", payload: id }),
    updateLeadStatus: (id: string, status: Lead["status"]) =>
      dispatch({ type: "UPDATE_LEAD_STATUS", payload: { id, status } }),
  };
}

export function useMessages() {
  const { state, dispatch } = useApp();
  return {
    messages: state.messages,
    conversations: state.conversations,
    addMessage: (message: Omit<Message, "id" | "timestamp"> & Partial<Pick<Message, "id" | "timestamp">>) => dispatch({
      type: "ADD_MESSAGE",
      payload: { ...message, id: message.id ?? crypto.randomUUID(), timestamp: message.timestamp ?? new Date().toISOString() },
    }),
    markConversationRead: (id: string) =>
      dispatch({ type: "MARK_CONVERSATION_READ", payload: id }),
    getConversationMessages: (conversationId: string) =>
      state.messages.filter((m) => m.conversationId === conversationId),
  };
}

export function useQuestions() {
  const { state, dispatch } = useApp();
  return {
    questions: state.questions,
    addQuestion: (question: Omit<Question, "id">) => dispatch({ type: "ADD_QUESTION", payload: { ...question, id: crypto.randomUUID() } }),
    updateQuestion: (id: string, updates: Omit<Question, "id">) =>
      dispatch({ type: "UPDATE_QUESTION", payload: { ...updates, id } }),
    deleteQuestion: (id: string) => dispatch({ type: "DELETE_QUESTION", payload: id }),
    toggleQuestion: (id: string) => dispatch({ type: "TOGGLE_QUESTION", payload: id }),
  };
}

export function useRoutingRules() {
  const { state, dispatch } = useApp();
  return {
    rules: state.routingRules,
    agents: state.agents,
    addRule: (rule: RoutingRule) => dispatch({ type: "ADD_ROUTING_RULE", payload: rule }),
    updateRule: (rule: RoutingRule) => dispatch({ type: "UPDATE_ROUTING_RULE", payload: rule }),
    deleteRule: (id: string) => dispatch({ type: "DELETE_ROUTING_RULE", payload: id }),
    toggleRule: (id: string) => dispatch({ type: "TOGGLE_ROUTING_RULE", payload: id }),
  };
}

export function useSettings() {
  const { state, dispatch } = useApp();
  return {
    settings: state.settings,
    updateSettings: (settings: Partial<Settings>) =>
      dispatch({ type: "UPDATE_SETTINGS", payload: settings }),
  };
}

export function useNotifications() {
  const { state, dispatch } = useApp();
  return {
    notifications: state.notifications,
    unreadCount: state.notifications.filter((n) => !n.read).length,
    addNotification: (notification: Notification) =>
      dispatch({ type: "ADD_NOTIFICATION", payload: notification }),
    markAsRead: (id: string) => dispatch({ type: "MARK_NOTIFICATION_READ", payload: id }),
    markAllAsRead: () => dispatch({ type: "MARK_ALL_NOTIFICATIONS_READ" }),
  };
}

export function useSearch() {
  const { state, dispatch } = useApp();
  return {
    query: state.searchQuery,
    results: state.searchResults,
    setQuery: (query: string) => dispatch({ type: "SET_SEARCH_QUERY", payload: query }),
  };
}
