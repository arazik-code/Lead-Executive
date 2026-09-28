import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Download,
  Phone,
  MessageSquare,
  Eye,
  MoreHorizontal,
  ArrowUpDown,
  Users,
  Plus,
  Trash2,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeads, Lead } from "@/lib/store";
import { LeadFormDialog } from "@/components/leads/LeadFormDialog";
import { LeadDetailDialog } from "@/components/leads/LeadDetailDialog";
import { LeadFilterDialog, LeadFilters } from "@/components/leads/LeadFilterDialog";
import { useToast } from "@/hooks/use-toast";

const intentVariants = {
  High: "success",
  Medium: "warning",
  Low: "secondary",
} as const;

const statusVariants = {
  New: "neon",
  Qualifying: "warning",
  Qualified: "success",
  Routed: "secondary",
} as const;

export default function Leads() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { leads, addLead, updateLead, deleteLead } = useLeads();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof Lead>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");

  const [filters, setFilters] = useState<LeadFilters>({
    status: [],
    intent: [],
    scoreRange: [0, 100],
    propertyTypes: [],
  });

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filters.status.length === 0 || filters.status.includes(lead.status);
    const matchesIntent = filters.intent.length === 0 || filters.intent.includes(lead.intent);
    const matchesScore = lead.score >= filters.scoreRange[0] && lead.score <= filters.scoreRange[1];
    const matchesProperty = filters.propertyTypes.length === 0 || filters.propertyTypes.includes(lead.propertyType);
    return matchesSearch && matchesStatus && matchesIntent && matchesScore && matchesProperty;
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }
    const aStr = String(aVal || "");
    const bStr = String(bVal || "");
    return sortDirection === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleAddLead = () => {
    setSelectedLead(null);
    setFormMode("add");
    setFormDialogOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setFormMode("edit");
    setDetailDialogOpen(false);
    setFormDialogOpen(true);
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailDialogOpen(true);
  };

  const handleSaveLead = (lead: Lead) => {
    if (formMode === "add") {
      addLead(lead);
      toast({ title: "Lead Added", description: `${lead.name} has been added successfully.` });
    } else {
      updateLead(lead.id, lead);
      toast({ title: "Lead Updated", description: `${lead.name} has been updated successfully.` });
    }
  };

  const handleDeleteClick = (id: string) => {
    setLeadToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (leadToDelete) {
      const lead = leads.find((l) => l.id === leadToDelete);
      deleteLead(leadToDelete);
      toast({ title: "Lead Deleted", description: `${lead?.name || "Lead"} has been removed.`, variant: "destructive" });
      setLeadToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleMessage = () => navigate("/messages");

  const handleExport = () => {
    const headers = ["Name", "Phone", "Email", "Budget", "Intent", "Score", "Status", "Assigned To", "Created At"];
    const rows = sortedLeads.map((lead) => [lead.name, lead.phone, lead.email || "", lead.budget, lead.intent, lead.score.toString(), lead.status, lead.assignedTo, lead.createdAt]);
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Complete", description: `${sortedLeads.length} leads exported to CSV.` });
  };

  const activeFiltersCount = filters.status.length + filters.intent.length + filters.propertyTypes.length + (filters.scoreRange[0] > 0 || filters.scoreRange[1] < 100 ? 1 : 0);

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">All captured leads with status and routing</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setFilterDialogOpen(true)}>
            <Filter className="h-3.5 w-3.5" />
            Filter
            {activeFiltersCount > 0 && <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">{activeFiltersCount}</Badge>}
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleAddLead}>
            <Plus className="h-3.5 w-3.5" />
            Add Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total", value: leads.length },
          { label: "New", value: leads.filter((l) => l.status === "New").length },
          { label: "Qualifying", value: leads.filter((l) => l.status === "Qualifying").length },
          { label: "Qualified", value: leads.filter((l) => l.status === "Qualified").length },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <span className="text-lg font-semibold text-foreground">{stat.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-5">
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone number, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-secondary/50 border-border"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            All Leads ({sortedLeads.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">
                  <Button variant="ghost" size="sm" className="gap-1 -ml-3 h-8" onClick={() => handleSort("name")}>
                    Lead <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-muted-foreground">Budget</TableHead>
                <TableHead className="text-muted-foreground">Intent</TableHead>
                <TableHead className="text-muted-foreground">
                  <Button variant="ghost" size="sm" className="gap-1 -ml-3 h-8" onClick={() => handleSort("score")}>
                    Score <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Assigned To</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLeads.map((lead) => (
                <TableRow key={lead.id} className="border-border hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => handleViewLead(lead)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                        {lead.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{lead.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{lead.budget}</TableCell>
                  <TableCell><Badge variant={intentVariants[lead.intent]}>{lead.intent}</Badge></TableCell>
                  <TableCell>
                    <span className={cn("font-bold", lead.score >= 80 ? "text-success" : lead.score >= 50 ? "text-warning" : "text-muted-foreground")}>{lead.score}</span>
                  </TableCell>
                  <TableCell><Badge variant={statusVariants[lead.status]}>{lead.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.assignedTo}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewLead(lead)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleMessage}><MessageSquare className="h-4 w-4" /></Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditLead(lead)}><Edit className="h-4 w-4 mr-2" />Edit Lead</DropdownMenuItem>
                          <DropdownMenuItem onClick={handleMessage}><MessageSquare className="h-4 w-4 mr-2" />Send Message</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(lead.id)}><Trash2 className="h-4 w-4 mr-2" />Delete Lead</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sortedLeads.length === 0 && (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No leads found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <LeadFormDialog open={formDialogOpen} onOpenChange={setFormDialogOpen} lead={selectedLead || undefined} onSave={handleSaveLead} mode={formMode} />
      <LeadDetailDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen} lead={selectedLead} onEdit={handleEditLead} onDelete={handleDeleteClick} onMessage={handleMessage} />
      <LeadFilterDialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen} filters={filters} onApply={setFilters} />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this lead? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
