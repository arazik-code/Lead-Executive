import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuestionCard } from "@/components/qualification/QuestionCard";
import { QuestionFormDialog } from "@/components/qualification/QuestionFormDialog";
import { ScoringRules } from "@/components/qualification/ScoringRules";
import { QualificationStats } from "@/components/qualification/QualificationStats";
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
  Plus,
  BarChart3,
  FileQuestion,
  Sparkles,
  Download,
  Upload,
} from "lucide-react";
import { useQuestions, Question } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

export default function Qualification() {
  const { questions, addQuestion, updateQuestion, deleteQuestion, toggleQuestion } = useQuestions();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"questions" | "scoring">("questions");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  const handleToggleQuestion = (id: string) => {
    toggleQuestion(id);
  };

  const handleAddQuestion = () => {
    setFormMode("add");
    setSelectedQuestion(null);
    setFormDialogOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setFormMode("edit");
    setSelectedQuestion(question);
    setFormDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setQuestionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (questionToDelete) {
      deleteQuestion(questionToDelete);
      toast({
        title: "Question deleted",
        description: "The question has been removed from the qualification flow.",
      });
    }
    setDeleteDialogOpen(false);
    setQuestionToDelete(null);
  };

  const handleSaveQuestion = (questionData: Omit<Question, "id">) => {
    if (formMode === "add") {
      addQuestion(questionData);
      toast({
        title: "Question added",
        description: "New question has been added to the qualification flow.",
      });
    } else if (selectedQuestion) {
      updateQuestion(selectedQuestion.id, questionData);
      toast({
        title: "Question updated",
        description: "Question has been successfully updated.",
      });
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(questions, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qualification-questions.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Export complete",
      description: "Qualification questions exported successfully.",
    });
  };

  const handleImport = () => {
    toast({
      title: "Import",
      description: "Import functionality coming soon!",
    });
  };

  const handleAddSuggested = (suggestion: string) => {
    addQuestion({
      question: suggestion,
      type: "single",
      options: [],
      weight: 10,
      required: false,
      enabled: true,
      category: "Location",
    });
    toast({
      title: "Question added",
      description: "AI-suggested question has been added.",
    });
  };

  const totalWeight = questions.filter((q) => q.enabled).reduce((sum, q) => sum + q.weight, 0);
  const enabledCount = questions.filter((q) => q.enabled).length;

  return (
    <MainLayout>
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Qualification
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure qualification questions and scoring rules
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleImport}>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Import
            </Button>
            <Button variant="default" size="sm" onClick={handleAddQuestion}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Question
            </Button>
          </div>
        </div>

        {/* Stats */}
        <QualificationStats />

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Button
            variant={activeTab === "questions" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("questions")}
          >
            <FileQuestion className="mr-1.5 h-3.5 w-3.5" />
            Questions ({questions.length})
          </Button>
          <Button
            variant={activeTab === "scoring" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("scoring")}
          >
            <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
            Scoring Rules
          </Button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            {activeTab === "questions" ? (
              <div className="space-y-3">
                {/* Weight Summary */}
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-accent" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {enabledCount} of {questions.length} questions enabled
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Drag to reorder, toggle to enable/disable
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total Weight</p>
                      <p
                        className={`text-lg font-display font-bold ${
                          totalWeight === 100 ? "text-success" : "text-warning"
                        }`}
                      >
                        {totalWeight}%
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Questions List */}
                <div className="space-y-3">
                  {questions.map((question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      onToggle={handleToggleQuestion}
                      onEdit={handleEditQuestion}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <ScoringRules />
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            <ScoringRules />

            {/* AI Insights */}
            <Card variant="glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-5 w-5 text-accent" />
                  AI Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  AI-powered suggestions to improve your qualification process
                </p>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-sm text-foreground">
                      Consider adding a question about property location
                      preferences to improve routing accuracy.
                    </p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="px-0 mt-2 text-accent"
                      onClick={() => handleAddSuggested("What are your preferred property locations or neighborhoods?")}
                    >
                      Add Suggested Question →
                    </Button>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-sm text-foreground">
                      The "Timeline" question has the highest correlation with
                      successful conversions.
                    </p>
                    <Badge variant="success" className="mt-2 text-[10px]">
                      +15% conversion rate
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Question Form Dialog */}
        <QuestionFormDialog
          key={`${formDialogOpen}-${formMode}-${selectedQuestion?.id ?? "new"}`}
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          question={selectedQuestion}
          onSave={handleSaveQuestion}
          mode={formMode}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Question</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this question? This action cannot be undone
                and will remove the question from your qualification flow.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
