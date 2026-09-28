import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { FAQSection } from "@/components/help/FAQSection";
import { useToast } from "@/hooks/use-toast";
import {
  HelpCircle,
  Search,
  Book,
  Video,
  MessageCircle,
  Mail,
  Phone,
  FileText,
  Zap,
  Target,
  Users,
  Settings,
  BarChart3,
  Lightbulb,
  ExternalLink,
  ArrowRight,
  Play,
  Clock,
  Star,
  CheckCircle,
  X,
  Send,
  Calendar,
} from "lucide-react";

const gettingStartedFAQ = [
  {
    question: "How do I set up my first qualification flow?",
    answer:
      "Navigate to the Qualification page from the sidebar, click 'Add Question' to create your first qualification question. You can customize the question type, options, and weight. Once you've added all your questions, enable them using the toggle switch and set the appropriate scoring thresholds.",
  },
  {
    question: "How does the AI-powered qualification work?",
    answer:
      "Our AI analyzes incoming WhatsApp messages and automatically asks qualification questions in a natural, conversational way. It extracts key information like budget, timeline, and property preferences, then calculates a lead score based on your configured weights and thresholds.",
  },
  {
    question: "Can I customize the qualification questions?",
    answer:
      "Yes! You have full control over the qualification questions. You can add, edit, delete, and reorder questions. Each question can be assigned a weight that contributes to the overall lead score. You can also set questions as required or optional.",
  },
];

const routingFAQ = [
  {
    question: "How does automatic lead routing work?",
    answer:
      "Lead routing rules are evaluated in priority order. When a new lead is qualified, the system checks each rule's conditions. The first matching rule determines where the lead is routed. If no rules match, the fallback rule (round-robin distribution) is applied.",
  },
  {
    question: "Can I set agent capacity limits?",
    answer:
      "Yes, each agent has a configurable maximum lead capacity. When an agent reaches their limit, they're marked as 'busy' and won't receive new leads until they complete existing ones. This ensures balanced workload distribution across your team.",
  },
  {
    question: "How do I create a new routing rule?",
    answer:
      "Go to the Routing page, click 'Add Rule', and define your conditions (budget range, location, lead score, etc.). Then specify the action - assign to a specific agent, add to a queue, or distribute via round-robin. Set the priority to determine evaluation order.",
  },
];

const integrationFAQ = [
  {
    question: "How do I connect my WhatsApp Business account?",
    answer:
      "Go to Settings > Integrations, click 'Connect WhatsApp'. You'll need to have a WhatsApp Business API account. Follow the OAuth flow to authorize access, then select which phone number to use for the pilot program.",
  },
  {
    question: "Can I integrate with my existing CRM?",
    answer:
      "Yes, we offer integrations with popular CRMs including Salesforce, HubSpot, and Pipedrive. API access is also available for custom integrations. All qualified leads can be automatically synced to your CRM with full conversation history.",
  },
  {
    question: "Is there an API available?",
    answer:
      "Yes, we provide a comprehensive REST API for all core functionality. You can programmatically manage leads, routing rules, agents, and access analytics. API documentation is available in the Settings > Developer section.",
  },
];

const guides = [
  {
    title: "Getting Started with Executive Lead Control",
    description:
      "Learn the basics of setting up your lead qualification and routing system.",
    icon: Zap,
    duration: "15 min read",
    difficulty: "beginner" as const,
    topics: ["Setup", "Configuration", "First Steps"],
    content: `
## Welcome to Executive Lead Control

This guide will walk you through setting up your lead qualification and routing system from scratch.

### Step 1: Configure Your Qualification Questions
Navigate to the Qualification page and create questions that help identify high-value leads. Consider asking about:
- Budget range
- Timeline for purchase
- Property type preferences
- Location requirements

### Step 2: Set Up Scoring Weights
Assign weights to each question based on importance. Higher weights mean more impact on the final lead score.

### Step 3: Create Routing Rules
Define where leads should go based on their qualification score:
- High-score leads (80+) → Senior brokers
- Medium-score leads (50-79) → Junior team
- Low-score leads (<50) → Nurture queue

### Step 4: Connect WhatsApp
Go to Settings and connect your WhatsApp Business account to start receiving leads automatically.
    `,
  },
  {
    title: "Mastering Lead Qualification",
    description:
      "Deep dive into creating effective qualification questions and scoring strategies.",
    icon: Target,
    duration: "25 min read",
    difficulty: "intermediate" as const,
    topics: ["Qualification", "Scoring", "Optimization"],
    content: `
## Mastering Lead Qualification

Learn advanced strategies for qualifying leads effectively.

### Understanding Lead Scoring
Lead scores are calculated based on:
- Question responses and their weights
- Engagement level (response time, message frequency)
- Behavioral signals (viewing specific properties)

### Optimizing Your Questions
- Keep questions conversational
- Use multiple choice for faster responses
- Include optional "nice-to-have" questions
- A/B test different question sequences

### Score Thresholds
Configure thresholds that match your business:
- **Hot Leads (80-100)**: Ready to buy, assign immediately
- **Warm Leads (50-79)**: Interested, needs nurturing
- **Cold Leads (0-49)**: Early stage, long-term follow-up

### Best Practices
1. Review and adjust weights monthly
2. Track conversion rates by score range
3. Get feedback from your sales team
    `,
  },
  {
    title: "Advanced Routing Strategies",
    description:
      "Learn how to create complex routing rules for maximum efficiency.",
    icon: Users,
    duration: "20 min read",
    difficulty: "advanced" as const,
    topics: ["Routing", "Automation", "Workflows"],
    content: `
## Advanced Routing Strategies

Take your lead routing to the next level with advanced configurations.

### Multi-Condition Rules
Combine multiple conditions for precise routing:
- Lead Score > 80 AND Budget > $500K → Top broker
- Location = "Downtown" AND Timeline = "Immediate" → Specialist team

### Priority-Based Routing
Rules are evaluated in priority order. Structure your rules:
1. High-priority exceptions (VIP referrals)
2. Score-based primary routing
3. Specialty matching (luxury, commercial)
4. Fallback round-robin

### Capacity Management
- Set maximum leads per agent
- Configure business hours
- Enable overflow routing

### Performance Tracking
Monitor routing effectiveness:
- Conversion rate by routing rule
- Average response time per agent
- Lead distribution balance
    `,
  },
  {
    title: "Analytics & Reporting",
    description:
      "Understand your pilot program's performance with comprehensive analytics.",
    icon: BarChart3,
    duration: "18 min read",
    difficulty: "intermediate" as const,
    topics: ["Analytics", "KPIs", "Reporting"],
    content: `
## Analytics & Reporting

Make data-driven decisions with Executive Lead Control analytics.

### Key Metrics
Track these essential KPIs:
- **Qualification Rate**: % of leads that complete qualification
- **Average Lead Score**: Overall quality of incoming leads
- **Routing Efficiency**: Time from qualification to assignment
- **Conversion Rate**: Leads that become customers

### Dashboard Overview
The analytics dashboard shows:
- Real-time lead flow
- Daily/weekly/monthly trends
- Agent performance comparisons
- Pipeline health indicators

### Exporting Reports
Generate reports for stakeholders:
1. Go to Analytics page
2. Select date range
3. Click Export
4. Choose format (CSV, PDF)

### Custom Date Ranges
Filter analytics by:
- Last 24 hours
- Last 7 days
- Last 30 days
- Custom date range
    `,
  },
];

export default function Help() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [guideDialogOpen, setGuideDialogOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<typeof guides[0] | null>(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [docType, setDocType] = useState("");
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactType, setContactType] = useState<"chat" | "email" | "call">("chat");
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Search through FAQs and guides
      const query = searchQuery.toLowerCase();
      const results: string[] = [];
      
      [...gettingStartedFAQ, ...routingFAQ, ...integrationFAQ].forEach(faq => {
        if (faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query)) {
          results.push(faq.question);
        }
      });
      
      guides.forEach(guide => {
        if (guide.title.toLowerCase().includes(query) || guide.description.toLowerCase().includes(query)) {
          results.push(guide.title);
        }
      });
      
      setSearchResults(results);
      setShowSearchResults(true);
    }
  };

  const handleQuickLinkClick = (label: string) => {
    setDocType(label);
    setDocDialogOpen(true);
  };

  const handleWatchVideo = () => {
    setVideoDialogOpen(true);
  };

  const handleViewAllGuides = () => {
    setDocType("All Guides");
    setDocDialogOpen(true);
  };

  const handleViewStatusPage = () => {
    setDocType("System Status");
    setDocDialogOpen(true);
  };

  const handleGuideClick = (guide: typeof guides[0]) => {
    setSelectedGuide(guide);
    setGuideDialogOpen(true);
  };

  const handleContactClick = (type: "chat" | "email" | "call") => {
    setContactType(type);
    setContactDialogOpen(true);
  };

  const handleSendContact = () => {
    toast({
      title: "Message Sent!",
      description: contactType === "chat" 
        ? "A support agent will respond shortly."
        : contactType === "email"
        ? "We'll respond within 24 hours."
        : "Your call has been scheduled.",
    });
    setContactDialogOpen(false);
    setContactForm({ name: "", email: "", message: "" });
  };

  const getDifficultyColor = (level: string): BadgeProps["variant"] => {
    switch (level) {
      case "beginner": return "success";
      case "intermediate": return "warning";
      case "advanced": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20 shadow-neon">
              <HelpCircle className="h-8 w-8 text-accent" />
            </div>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Help Center
          </h1>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            Find answers, learn best practices, and get support for Executive Lead Control
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto mt-6">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search for help articles, guides, and more..."
              className="pl-12 h-12 text-base bg-secondary border-border"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value) setShowSearchResults(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
            />
            {showSearchResults && searchResults.length > 0 && (
              <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-60 overflow-auto">
                <CardContent className="p-2">
                  {searchResults.map((result, i) => (
                    <div
                      key={i}
                      className="p-2 hover:bg-secondary rounded cursor-pointer text-sm text-left"
                      onClick={() => {
                        const guide = guides.find(g => g.title === result);
                        if (guide) {
                          handleGuideClick(guide);
                        }
                        setShowSearchResults(false);
                      }}
                    >
                      {result}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {showSearchResults && searchResults.length === 0 && searchQuery && (
              <Card className="absolute top-full left-0 right-0 mt-2 z-50">
                <CardContent className="p-4 text-center text-sm text-muted-foreground">
                  No results found for "{searchQuery}"
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Book, label: "Documentation", count: "45 articles" },
            { icon: Video, label: "Video Tutorials", count: "12 videos" },
            { icon: FileText, label: "API Reference", count: "Complete docs" },
            { icon: Lightbulb, label: "Best Practices", count: "8 guides" },
          ].map((item, index) => (
            <Card
              key={index}
              variant="glass"
              className="p-4 hover:border-accent/30 transition-all cursor-pointer group"
              onClick={() => handleQuickLinkClick(item.label)}
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 border border-accent/20 text-accent mb-3 group-hover:shadow-neon transition-shadow">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="font-medium text-foreground text-sm">
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.count}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Featured Video */}
        <Card variant="glow" className="overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="relative bg-gradient-to-br from-accent/20 to-neon-purple/10 flex items-center justify-center min-h-[200px]">
              <div className="absolute inset-0 grid-pattern opacity-20" />
              <Button
                variant="neon"
                size="lg"
                className="rounded-full h-16 w-16 relative z-10"
                onClick={handleWatchVideo}
              >
                <Play className="h-6 w-6 ml-1" />
              </Button>
              <Badge
                variant="secondary"
                className="absolute bottom-4 left-4 text-xs"
              >
                <Clock className="h-3 w-3 mr-1" />
                8:32
              </Badge>
            </div>
            <div className="p-6 flex flex-col justify-center">
              <Badge variant="neon" className="w-fit mb-3 text-[10px]">
                Featured Video
              </Badge>
              <h3 className="font-display text-xl font-semibold text-foreground">
                Complete Platform Walkthrough
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Get a comprehensive tour of Executive Lead Control, from setting up
                your first qualification flow to analyzing pilot results.
              </p>
              <Button variant="outline" className="w-fit mt-4" onClick={handleWatchVideo}>
                Watch Now
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Guides Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                Popular Guides
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Step-by-step tutorials to help you succeed
              </p>
            </div>
            <Button variant="ghost" className="text-accent" onClick={handleViewAllGuides}>
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {guides.map((guide, index) => (
              <Card 
                key={index}
                variant="glass" 
                className="hover:border-accent/30 transition-all duration-300 group cursor-pointer"
                onClick={() => handleGuideClick(guide)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 text-accent group-hover:shadow-neon transition-shadow">
                      <guide.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-medium text-foreground">
                        {guide.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant={getDifficultyColor(guide.difficulty)}
                          className="text-[10px] capitalize"
                        >
                          {guide.difficulty}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{guide.duration}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{guide.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {guide.topics.map((topic, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="grid md:grid-cols-3 gap-6">
          <FAQSection title="Getting Started" items={gettingStartedFAQ} />
          <FAQSection title="Lead Routing" items={routingFAQ} />
          <FAQSection title="Integrations" items={integrationFAQ} />
        </div>

        {/* Contact Support */}
        <div>
          <div className="text-center mb-6">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Need More Help?
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Our support team is here to assist you
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Card variant="glass" className="hover:border-accent/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 text-accent shrink-0">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground">Live Chat</h3>
                    <p className="text-sm text-muted-foreground mt-1">Chat with our support team in real-time</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs text-muted-foreground">Mon-Fri, 9am-6pm PST</span>
                      <Badge variant="secondary" className="text-[10px]">{"< 5 min response"}</Badge>
                    </div>
                    <Button variant="neon" size="sm" className="mt-4" onClick={() => handleContactClick("chat")}>
                      Start Chat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" className="hover:border-accent/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 text-accent shrink-0">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground">Email Support</h3>
                    <p className="text-sm text-muted-foreground mt-1">Send us a detailed message</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs text-muted-foreground">support@execleadcontrol.com</span>
                      <Badge variant="secondary" className="text-[10px]">{"< 24 hour response"}</Badge>
                    </div>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => handleContactClick("email")}>
                      Send Email
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" className="hover:border-accent/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 text-accent shrink-0">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground">Schedule a Call</h3>
                    <p className="text-sm text-muted-foreground mt-1">Book a call with our team</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs text-muted-foreground">Available by appointment</span>
                      <Badge variant="secondary" className="text-[10px]">30 min sessions</Badge>
                    </div>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => handleContactClick("call")}>
                      Book Call
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* System Status */}
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
                <span className="text-sm text-foreground">
                  All systems operational
                </span>
              </div>
              <Button variant="ghost" size="sm" className="text-accent" onClick={handleViewStatusPage}>
                View Status Page
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guide Dialog */}
      <Dialog open={guideDialogOpen} onOpenChange={setGuideDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {selectedGuide && (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 border border-accent/20 text-accent">
                  <selectedGuide.icon className="h-5 w-5" />
                </div>
              )}
              <div>
                <DialogTitle>{selectedGuide?.title}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  {selectedGuide && (
                    <>
                      <Badge variant={getDifficultyColor(selectedGuide.difficulty)} className="text-[10px]">
                        {selectedGuide.difficulty}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{selectedGuide.duration}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="prose prose-sm prose-invert max-w-none">
              {selectedGuide?.content.split('\n').map((line, i) => {
                if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-lg font-semibold text-foreground mt-4 mb-2">{line.replace('## ', '')}</h2>;
                } else if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-base font-medium text-foreground mt-3 mb-1">{line.replace('### ', '')}</h3>;
                } else if (line.startsWith('- ')) {
                  return <li key={i} className="text-sm text-muted-foreground ml-4">{line.replace('- ', '')}</li>;
                } else if (line.startsWith('**')) {
                  return <p key={i} className="text-sm text-foreground font-medium">{line.replace(/\*\*/g, '')}</p>;
                } else if (line.match(/^\d+\./)) {
                  return <li key={i} className="text-sm text-muted-foreground ml-4 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>;
                } else if (line.trim()) {
                  return <p key={i} className="text-sm text-muted-foreground mb-2">{line}</p>;
                }
                return null;
              })}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGuideDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Complete Platform Walkthrough</DialogTitle>
            <DialogDescription>
              A comprehensive tour of Executive Lead Control
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-neon-purple/10 rounded-lg" />
            <div className="text-center z-10">
              <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-accent/20 border border-accent/30 mb-4">
                <Play className="h-8 w-8 text-accent ml-1" />
              </div>
              <p className="text-muted-foreground">Video walkthrough</p>
              <p className="text-xs text-muted-foreground mt-1">Duration: 8:32</p>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm">In this video:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-success" /> Setting up qualification questions</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-success" /> Configuring routing rules</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-success" /> Managing your agent team</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-success" /> Analyzing pilot results</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Documentation Dialog */}
      <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{docType}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {docType === "Documentation" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Browse our comprehensive documentation:</p>
                {["Getting Started", "Lead Management", "Qualification Setup", "Routing Rules", "Agent Management", "Analytics & Reports", "API Reference", "Troubleshooting"].map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-accent" />
                      <span className="text-sm">{doc}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
            {docType === "Video Tutorials" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Watch our video tutorials:</p>
                {["Platform Overview (8:32)", "Setting Up Qualification (12:15)", "Advanced Routing (10:45)", "Analytics Deep Dive (15:20)", "Best Practices (8:00)"].map((video, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 cursor-pointer" onClick={() => { setDocDialogOpen(false); setVideoDialogOpen(true); }}>
                    <div className="flex items-center gap-3">
                      <Video className="h-4 w-4 text-accent" />
                      <span className="text-sm">{video}</span>
                    </div>
                    <Play className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
            {docType === "API Reference" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">API endpoints and documentation:</p>
                <div className="bg-secondary p-4 rounded-lg font-mono text-xs">
                  <p className="text-accent">Base URL: https://api.execleadcontrol.com/v1</p>
                  <div className="mt-4 space-y-2">
                    <p><span className="text-success">GET</span> /leads - List all leads</p>
                    <p><span className="text-warning">POST</span> /leads - Create a lead</p>
                    <p><span className="text-success">GET</span> /leads/:id - Get lead details</p>
                    <p><span className="text-accent">PUT</span> /leads/:id - Update a lead</p>
                    <p><span className="text-destructive">DELETE</span> /leads/:id - Delete a lead</p>
                    <p><span className="text-success">GET</span> /routing-rules - List routing rules</p>
                    <p><span className="text-success">GET</span> /agents - List agents</p>
                    <p><span className="text-success">GET</span> /analytics - Get analytics data</p>
                  </div>
                </div>
              </div>
            )}
            {docType === "Best Practices" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Best practices for success:</p>
                {["Qualification Question Design", "Score Threshold Optimization", "Routing Rule Strategy", "Agent Capacity Planning", "Performance Monitoring", "Continuous Improvement"].map((practice, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Lightbulb className="h-4 w-4 text-warning" />
                      <span className="text-sm">{practice}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
            {docType === "All Guides" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">All available guides:</p>
                {guides.map((guide, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 cursor-pointer" onClick={() => { setDocDialogOpen(false); handleGuideClick(guide); }}>
                    <div className="flex items-center gap-3">
                      <guide.icon className="h-4 w-4 text-accent" />
                      <div>
                        <span className="text-sm">{guide.title}</span>
                        <p className="text-xs text-muted-foreground">{guide.duration}</p>
                      </div>
                    </div>
                    <Badge variant={getDifficultyColor(guide.difficulty)} className="text-[10px]">{guide.difficulty}</Badge>
                  </div>
                ))}
              </div>
            )}
            {docType === "System Status" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium text-success">All Systems Operational</span>
                </div>
                <div className="space-y-3">
                  {["API Server", "WhatsApp Integration", "Database", "Analytics Engine", "Routing Service", "Notification Service"].map((service, i) => (
                    <div key={i} className="flex items-center justify-between p-2">
                      <span className="text-sm">{service}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-success" />
                        <span className="text-xs text-muted-foreground">Operational</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center pt-4">Last updated: {new Date().toLocaleString()}</p>
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {contactType === "chat" && "Start Live Chat"}
              {contactType === "email" && "Send Email"}
              {contactType === "call" && "Schedule a Call"}
            </DialogTitle>
            <DialogDescription>
              {contactType === "chat" && "Chat with our support team in real-time"}
              {contactType === "email" && "We'll respond within 24 hours"}
              {contactType === "call" && "Book a 30-minute call with our team"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Your Name</Label>
              <Input 
                placeholder="John Doe"
                value={contactForm.name}
                onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input 
                type="email"
                placeholder="john@example.com"
                value={contactForm.email}
                onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
              />
            </div>
            {contactType === "call" && (
              <div className="space-y-2">
                <Label>Preferred Date & Time</Label>
                <Input type="datetime-local" />
              </div>
            )}
            <div className="space-y-2">
              <Label>{contactType === "call" ? "Meeting Topic" : "Message"}</Label>
              <Textarea 
                placeholder={contactType === "call" ? "What would you like to discuss?" : "How can we help you?"}
                rows={4}
                value={contactForm.message}
                onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendContact}>
              {contactType === "chat" && <><MessageCircle className="mr-2 h-4 w-4" /> Start Chat</>}
              {contactType === "email" && <><Send className="mr-2 h-4 w-4" /> Send Email</>}
              {contactType === "call" && <><Calendar className="mr-2 h-4 w-4" /> Schedule Call</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
