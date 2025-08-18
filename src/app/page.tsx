
'use client';

import * as React from 'react';
import {
  Book,
  Bot,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Notebook,
  PlusCircle,
  RefreshCcw,
  Send,
  Sparkles,
  User,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import type { Project, Source, Message, Citation } from '@/lib/types';
import { MOCK_PROJECTS } from '@/lib/data';
import { generateDocumentSummary } from '@/ai/flows/generate-document-summary';
import { answerQuestionsFromDocuments } from '@/ai/flows/answer-questions-from-documents';
import { Logo } from '@/components/scholar-chat/logo';
import { UploadDialog } from '@/components/scholar-chat/upload-dialog';

export default function ScholarChat() {
  const [projects, setProjects] = React.useState<Project[]>(MOCK_PROJECTS);
  const [activeProject, setActiveProject] = React.useState<Project>(projects[0]);
  const [activeSource, setActiveSource] = React.useState<Source | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const { toast } = useToast();

  const handleCreateProject = () => {
    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name: 'Untitled Project',
      sources: [],
      summary: 'No summary generated yet. Add sources to get started.',
      conversations: [{ id: 'conv_1', messages: [] }],
    };
    setProjects(prev => [newProject, ...prev]);
    setActiveProject(newProject);
    toast({
      title: 'Project Created',
      description: 'Your new project is ready.',
    });
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    const newSource: Source = {
      id: `src_${Date.now()}`,
      name: file.name,
      status: 'processing',
      content: 'File content is being extracted...',
      page: 1,
    };

    setActiveProject(prev => ({
      ...prev,
      sources: [newSource, ...prev.sources],
    }));

    // Simulate file processing and summary generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    const fileContent = `This is the simulated content for ${file.name}. It contains key details about AI research and development.`;
    
    const updatedSource = { ...newSource, status: 'indexed' as const, content: fileContent };

    try {
      const summaryResult = await generateDocumentSummary({
        documentTitle: updatedSource.name,
        documentText: updatedSource.content,
      });

      setActiveProject(prev => {
        const updatedSources = prev.sources.map(s => (s.id === newSource.id ? updatedSource : s));
        const newSummary = `Summary for ${updatedSource.name}: ${summaryResult.summary}`;
        return { ...prev, sources: updatedSources, summary: newSummary };
      });

      toast({
        title: 'Upload Successful',
        description: `${file.name} has been indexed and summarized.`,
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate summary for the document.',
      });
      // Still update source status
       setActiveProject(prev => {
        const updatedSources = prev.sources.map(s => (s.id === newSource.id ? {...updatedSource, status: 'error' as const } : s));
        return { ...prev, sources: updatedSources };
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex min-h-screen bg-background text-foreground">
          <Sidebar collapsible="icon" className="group-data-[variant=inset]:bg-transparent">
            <SidebarHeader className="p-4">
              <Logo />
            </SidebarHeader>
            <SidebarContent className="p-0">
              <div className="flex flex-col h-full">
                <div className="p-2">
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={handleCreateProject}>
                    <PlusCircle className="size-4" />
                    <span className="font-headline">New Project</span>
                  </Button>
                </div>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuSub>
                      {projects.map(project => (
                        <SidebarMenuSubItem key={project.id}>
                          <SidebarMenuSubButton
                            onClick={() => setActiveProject(project)}
                            isActive={activeProject.id === project.id}
                          >
                            <Notebook className="size-4" />
                            <span className="truncate font-headline">{project.name}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                </SidebarMenu>

                <div className="flex-grow p-2">
                  <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground font-headline">Sources</h3>
                  <ScrollArea className="h-[calc(100vh-250px)]">
                    <SidebarMenu>
                      {activeProject.sources.map(source => (
                        <SidebarMenuItem key={source.id}>
                          <SidebarMenuButton
                            onClick={() => setActiveSource(source)}
                            tooltip={source.name}
                            className="justify-start gap-2"
                          >
                            <FileText className="size-4" />
                            <span className="truncate font-body">{source.name}</span>
                            {source.status === 'processing' && <Loader2 className="size-4 animate-spin ml-auto" />}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </ScrollArea>
                </div>
              </div>
            </SidebarContent>
            <SidebarFooter className="p-2">
               <UploadDialog onUpload={handleUpload} isUploading={isUploading} />
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="flex-1 flex flex-col">
            <main className="flex-1 p-4 md:p-6 flex justify-center">
              <div className="w-full max-w-4xl">
                <Tabs defaultValue="chat" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="chat" className="font-headline">Chat</TabsTrigger>
                    <TabsTrigger value="summary" className="font-headline">Summary</TabsTrigger>
                  </TabsList>
                  <TabsContent value="chat">
                    <ChatView project={activeProject} onCitationClick={setActiveSource} />
                  </TabsContent>
                  <TabsContent value="summary">
                    <SummaryView project={activeProject} />
                  </TabsContent>
                </Tabs>
              </div>
            </main>
          </SidebarInset>

          <Sheet open={!!activeSource} onOpenChange={open => !open && setActiveSource(null)}>
            <SheetContent className="w-full sm:w-3/4 lg:w-1/2 xl:w-1/3 p-0" side="right">
              {activeSource && (
                <>
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle className="font-headline flex items-center gap-2">
                      <FileText />
                      {activeSource.name}
                    </SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-full">
                    <p className="p-6 font-body text-sm whitespace-pre-wrap">{activeSource.content}</p>
                  </ScrollArea>
                </>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}

function ChatView({ project, onCitationClick }: { project: Project; onCitationClick: (source: Source) => void }) {
  const [messages, setMessages] = React.useState<Message[]>(project.conversations[0]?.messages || []);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    setMessages(project.conversations[0]?.messages || []);
  }, [project.id, project.conversations]);

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (project.sources.length === 0) {
        throw new Error("Please upload a document before asking questions.");
      }
      
      const contextPassages = project.sources.filter(s => s.status === 'indexed').map(s => ({
        sourceId: s.id,
        page: s.page,
        text: s.content,
      }));

      const response = await answerQuestionsFromDocuments({
        projectId: project.id,
        conversationId: project.conversations[0].id,
        userQuery: input,
        contextPassages: contextPassages,
      });

      const assistantMessage: Message = {
        role: 'assistant',
        text: response.answer,
        citations: response.citations.map(c => ({
          ...c,
          source: project.sources.find(s => s.id === c.sourceId) || null,
        })),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "I can't answer that from the provided documents.";
      const errorAssistantMessage: Message = { role: 'assistant', text: errorMessage };
      setMessages(prev => [...prev, errorAssistantMessage]);
       toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-[calc(100vh-150px)] flex flex-col mt-4">
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground pt-10 font-body">
                <p>Start a conversation by asking a question about your documents.</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      <Bot className="size-5" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'p-3 rounded-lg max-w-lg',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm font-body whitespace-pre-wrap">{message.text}</p>
                    {message.citations && message.citations.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-muted-foreground/20">
                        <h4 className="text-xs font-bold mb-1 font-headline">Sources:</h4>
                        <div className="space-y-1">
                          {message.citations.map((citation, i) =>
                            citation.source ? (
                              <button
                                key={i}
                                onClick={() => onCitationClick(citation.source!)}
                                className="text-xs text-left w-full p-1.5 rounded bg-background/50 hover:bg-background transition-colors"
                              >
                                <span className="font-semibold text-accent">[ {citation.source.name}, p{citation.page} ]</span>
                                <em className="block truncate italic text-muted-foreground">"{citation.snippet}"</em>
                              </button>
                            ) : null
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                     <div className="p-2 rounded-full bg-accent/10 text-accent">
                      <User className="size-5" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                 <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Bot className="size-5" />
                </div>
                <div className="p-3 rounded-lg bg-muted flex items-center space-x-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span className="text-sm font-body">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <div className="relative">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question about your documents..."
              className="pr-12 h-12 font-body"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              <Send className="size-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryView({ project }: { project: Project }) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [summary, setSummary] = React.useState(project.summary);
  const { toast } = useToast();

  React.useEffect(() => {
    setSummary(project.summary);
  }, [project.summary]);

  const handleRegenerate = async () => {
    if (project.sources.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Cannot Generate Summary',
        description: 'Please upload at least one document.',
      });
      return;
    }
    
    setIsGenerating(true);
    try {
      const combinedText = project.sources.map(s => s.content).join('\n\n');
      const result = await generateDocumentSummary({
        documentTitle: project.name,
        documentText: combinedText,
      });
      setSummary(result.summary);
      // In a real app, this would update the project in the database
      toast({ title: 'Summary Regenerated' });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to regenerate summary.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="font-headline flex items-center gap-2">
            <Sparkles className="text-accent" />
            Project Summary
          </CardTitle>
          <Button onClick={handleRegenerate} disabled={isGenerating} size="sm">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Regenerate
          </Button>
        </div>
        <CardDescription className="font-body">An AI-generated summary of all sources in this project.</CardDescription>
      </CardHeader>
      <CardContent>
        {isGenerating && !summary ? (
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
          </div>
        ) : (
          <p className="font-body text-sm whitespace-pre-wrap">{summary}</p>
        )}
      </CardContent>
    </Card>
  );
}
