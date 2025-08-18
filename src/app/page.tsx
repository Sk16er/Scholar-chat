
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
  Share2,
  Sparkles,
  Trash2,
  User,
  Volume2,
} from 'lucide-react';
import ReactFlow, { MiniMap, Controls, Background, Handle, Position } from 'react-flow-renderer';


import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  SidebarProvider,
  SidebarInset,
  SidebarFooter,
  SidebarMenuAction,
} from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import type { Project, Source, Message, Citation, MindMap } from '@/lib/types';
import { MOCK_PROJECTS } from '@/lib/data';
import { generateDocumentSummary } from '@/ai/flows/generate-document-summary';
import { answerQuestionsFromDocuments } from '@/ai/flows/answer-questions-from-documents';
import { generateMindMap } from '@/ai/flows/generate-mind-map';
import { generateAudioOverview } from '@/ai/flows/generate-audio-overview';
import { extractTextFromUrl } from '@/ai/flows/extract-text-from-url';
import { extractTextFromFile } from '@/ai/flows/extract-text-from-file';
import { Logo } from '@/components/scholar-chat/logo';
import { UploadDialog } from '@/components/scholar-chat/upload-dialog';

type SourceUpload = { type: 'file', content: File } | { type: 'youtube', content: string } | { type: 'website', content: string };

type DeletionTarget = { type: 'project', id: string } | { type: 'source', id: string } | null;

export default function ScholarChat() {
  const [projects, setProjects] = React.useState<Project[]>(MOCK_PROJECTS);
  const [activeProject, setActiveProject] = React.useState<Project | null>(projects.length > 0 ? projects[0] : null);
  const [activeSource, setActiveSource] = React.useState<Source | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [deletionTarget, setDeletionTarget] = React.useState<DeletionTarget>(null);

  const { toast } = useToast();

  const handleCreateProject = () => {
    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name: 'Untitled Project',
      sources: [],
      summary: 'No summary generated yet. Add sources to get started.',
      conversations: [{ id: 'conv_1', messages: [] }],
      mindMap: null,
      audioOverview: null,
    };
    setProjects(prev => [newProject, ...prev]);
    setActiveProject(newProject);
    toast({
      title: 'Project Created',
      description: 'Your new project is ready.',
    });
  };

  const handleUpload = async (source: SourceUpload) => {
    if (!activeProject) {
      toast({ variant: 'destructive', title: 'Error', description: 'No active project to add a source to.' });
      return;
    }
    setIsUploading(true);
  
    let fileName = '';
    let fileContentPromise: Promise<{ content: string; name: string }>;
  
    if (source.type === 'file') {
      fileName = source.content.name;
      fileContentPromise = new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUri = e.target?.result as string;
          try {
            const { content } = await extractTextFromFile({ fileDataUri: dataUri });
            resolve({ content, name: source.content.name });
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(source.content);
      });
    } else {
      // YouTube or Website
      fileName = source.content;
      fileContentPromise = extractTextFromUrl({ url: source.content });
    }
  
    const newSource: Source = {
      id: `src_${Date.now()}`,
      name: fileName,
      status: 'processing',
      content: 'Content is being extracted...',
      page: 1,
    };
  
    const projectWithNewSource = activeProject
      ? { ...activeProject, sources: [newSource, ...activeProject.sources] }
      : null;
  
    if (projectWithNewSource) {
      setActiveProject(projectWithNewSource);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectWithNewSource.id ? projectWithNewSource : p))
      );
    }
  
    try {
      const { content: fetchedContent, name: fetchedName } = await fileContentPromise;

      if (fetchedContent === 'I am unable to access this URL.' || fetchedContent === 'I am unable to process this file.') {
        throw new Error(fetchedContent);
      }

      const updatedSource = {
        ...newSource,
        status: 'indexed' as const,
        content: fetchedContent,
        name: fetchedName || fileName,
      };
  
      const summaryResult = await generateDocumentSummary({
        documentTitle: updatedSource.name,
        documentText: updatedSource.content,
      });
  
      setProjects((prevProjects) =>
        prevProjects.map((p) => {
          if (p.id !== activeProject.id) return p;
          const updatedSources = p.sources.map((s) =>
            s.id === newSource.id ? updatedSource : s
          );
          const combinedSummaryText = updatedSources
            .map((s) => s.content)
            .join('\n\n');
  
          const newSummary = `Summary for ${updatedSource.name}: ${summaryResult.summary}`;
          const updatedProject = {
            ...p,
            sources: updatedSources,
            summary: newSummary,
          };
          setActiveProject(updatedProject);
          return updatedProject;
        })
      );
  
      toast({
        title: 'Upload Successful',
        description: `${updatedSource.name} has been indexed and summarized.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process the source.';
      console.error('Error processing source:', error);
      toast({
        variant: 'destructive',
        title: 'Error Processing Source',
        description: errorMessage,
      });
      setProjects((prevProjects) =>
        prevProjects.map((p) => {
          if (p.id !== activeProject.id) return p;
          const updatedSources = p.sources.map((s) =>
            s.id === newSource.id ? { ...s, status: 'error' as const, content: errorMessage } : s
          );
          const updatedProject = { ...p, sources: updatedSources };
          setActiveProject(updatedProject);
          return updatedProject;
        })
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = () => {
    if (!deletionTarget) return;

    if (deletionTarget.type === 'project') {
      const newProjects = projects.filter(p => p.id !== deletionTarget.id);
      setProjects(newProjects);

      if (activeProject?.id === deletionTarget.id) {
        setActiveProject(newProjects.length > 0 ? newProjects[0] : null);
      }
      toast({ title: 'Project Deleted' });
    } else if (deletionTarget.type === 'source') {
      if (!activeProject) return;

      const newSources = activeProject.sources.filter(s => s.id !== deletionTarget.id);
      const updatedProject = { ...activeProject, sources: newSources };
      
      setProjects(projects.map(p => p.id === activeProject.id ? updatedProject : p));
      setActiveProject(updatedProject);
      if (activeSource?.id === deletionTarget.id) {
        setActiveSource(null);
      }
      toast({ title: 'Source Deleted' });
    }

    setDeletionTarget(null);
  };

  const updateProject = (updatedProject: Project) => {
    setActiveProject(updatedProject);
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  }


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
                  <SidebarMenuSub>
                    {projects.map(project => (
                      <SidebarMenuItem key={project.id}>
                        <SidebarMenuButton
                          onClick={() => setActiveProject(project)}
                          isActive={activeProject?.id === project.id}
                        >
                          <Notebook className="size-4" />
                          <span className="truncate font-headline">{project.name}</span>
                        </SidebarMenuButton>
                         <SidebarMenuAction showOnHover onClick={(e) => { e.stopPropagation(); setDeletionTarget({ type: 'project', id: project.id })}}>
                          <Trash2 className="size-4" />
                        </SidebarMenuAction>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarMenu>

                {activeProject && (
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
                            <SidebarMenuAction showOnHover onClick={(e) => { e.stopPropagation(); setDeletionTarget({ type: 'source', id: source.id })}}>
                              <Trash2 className="size-4" />
                            </SidebarMenuAction>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </SidebarContent>
            <SidebarFooter className="p-2">
               <UploadDialog onUpload={handleUpload} isUploading={isUploading} />
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="flex-1 flex flex-col">
            <main className="flex-1 p-4 md:p-6 flex justify-center">
              <div className="w-full max-w-4xl">
               {activeProject ? (
                  <Tabs defaultValue="chat" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="chat" className="font-headline">Chat</TabsTrigger>
                      <TabsTrigger value="summary" className="font-headline">Summary</TabsTrigger>
                      <TabsTrigger value="mindmap" className="font-headline">Mind Map</TabsTrigger>
                    </TabsList>
                    <TabsContent value="chat">
                      <ChatView project={activeProject} onCitationClick={setActiveSource} />
                    </TabsContent>
                    <TabsContent value="summary">
                      <SummaryView project={activeProject} onUpdateProject={updateProject} />
                    </TabsContent>
                    <TabsContent value="mindmap">
                      <MindMapView project={activeProject} onUpdateProject={updateProject} />
                    </TabsContent>
                  </Tabs>
               ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Notebook className="size-12 mb-4" />
                    <h2 className="text-xl font-semibold font-headline">No Project Selected</h2>
                    <p className="font-body">Create a new project or select an existing one to get started.</p>
                  </div>
               )}
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

          <AlertDialog open={!!deletionTarget} onOpenChange={() => setDeletionTarget(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the {deletionTarget?.type} and all of its data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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

function SummaryView({ project, onUpdateProject }: { project: Project; onUpdateProject: (project: Project) => void; }) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = React.useState(false);
  const [summary, setSummary] = React.useState(project.summary);
  const [audioDataUri, setAudioDataUri] = React.useState<string | null>(project.audioOverview);
  const { toast } = useToast();

  React.useEffect(() => {
    setSummary(project.summary);
    setAudioDataUri(project.audioOverview);
  }, [project.summary, project.audioOverview]);

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
      onUpdateProject({ ...project, summary: result.summary, audioOverview: null });
      setAudioDataUri(null);
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

  const handleGenerateAudio = async () => {
    if (!summary || summary === 'No summary generated yet. Add sources to get started.') {
       toast({
        variant: 'destructive',
        title: 'Cannot Generate Audio',
        description: 'Please generate a summary first.',
      });
      return;
    }
    setIsGeneratingAudio(true);
    try {
      const result = await generateAudioOverview(summary);
      setAudioDataUri(result.audioDataUri);
      onUpdateProject({ ...project, audioOverview: result.audioDataUri });
      toast({ title: 'Audio Overview Generated' });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate audio overview.',
      });
    } finally {
      setIsGeneratingAudio(false);
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
          <div className="flex gap-2">
            <Button onClick={handleGenerateAudio} disabled={isGeneratingAudio || isGenerating} size="sm" variant="outline">
              {isGeneratingAudio ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="mr-2 h-4 w-4" />}
              Audio Overview
            </Button>
            <Button onClick={handleRegenerate} disabled={isGenerating} size="sm">
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Regenerate
            </Button>
          </div>
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
          <>
            {audioDataUri && (
              <div className="mb-4">
                <audio controls className="w-full">
                  <source src={audioDataUri} type="audio/wav" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
            <p className="font-body text-sm whitespace-pre-wrap">{summary}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

const nodeTypes = {
  source: ({ data }: { data: { label: string } }) => (
    <div className="p-2 text-xs bg-blue-100 border border-blue-400 rounded-md shadow-md w-48">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-blue-600" />
        <strong className="font-headline">{data.label}</strong>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  ),
  concept: ({ data }: { data: { label: string } }) => (
    <div className="p-2 text-xs bg-purple-100 border border-purple-400 rounded-md shadow-md w-48">
      <Handle type="target" position={Position.Top} />
       <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-600" />
        <strong className="font-body">{data.label}</strong>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  ),
};

function MindMapView({ project, onUpdateProject }: { project: Project; onUpdateProject: (project: Project) => void; }) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [elements, setElements] = React.useState<any[]>([]);
  const { toast } = useToast();

  const convertToFlowElements = (mindMap: MindMap | null) => {
    if (!mindMap) return [];
    const nodes = mindMap.nodes.map(node => ({
      id: node.id,
      type: node.type,
      data: { label: node.label },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
    }));
    const edges = mindMap.edges.map(edge => ({
      id: edge.id,
      source: edge.from,
      target: edge.to,
      label: edge.label,
      animated: true,
      arrowHeadType: 'arrowclosed',
    }));
    return [...nodes, ...edges];
  };
  
  React.useEffect(() => {
    if (project.mindMap) {
      setElements(convertToFlowElements(project.mindMap));
    }
  }, [project.mindMap]);

  const handleGenerateMindMap = async () => {
     if (project.sources.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Cannot Generate Mind Map',
        description: 'Please upload at least one document.',
      });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateMindMap({ 
        sources: project.sources.filter(s => s.status === 'indexed') 
      });
      onUpdateProject({ ...project, mindMap: result });
      setElements(convertToFlowElements(result));
      toast({ title: 'Mind Map Generated' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate mind map.',
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
            <Share2 className="text-accent" />
            Project Mind Map
          </CardTitle>
          <Button onClick={handleGenerateMindMap} disabled={isGenerating} size="sm">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            {project.mindMap ? 'Regenerate' : 'Generate'}
          </Button>
        </div>
        <CardDescription className="font-body">An AI-generated mind map of concepts and sources in this project.</CardDescription>
      </CardHeader>
      <CardContent className="h-[calc(100vh-250px)] p-0">
        {isGenerating && elements.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : elements.length > 0 ? (
            <ReactFlow
              elements={elements}
              nodeTypes={nodeTypes}
              fitView
            >
              <MiniMap />
              <Controls />
              <Background />
            </ReactFlow>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Share2 className="size-12 mb-4" />
            <h2 className="text-xl font-semibold font-headline">No Mind Map Generated</h2>
            <p className="font-body">Click "Generate" to create a mind map for this project.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
