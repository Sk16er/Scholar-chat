
export interface Project {
  id: string;
  name: string;
  sources: Source[];
  summary: string;
  conversations: Conversation[];
  mindMap: MindMap | null;
  audioOverview: string | null;
}

export interface Source {
  id: string;
  name: string;
  status: 'indexed' | 'processing' | 'error';
  content: string;
  page: number;
}

export interface Conversation {
  id: string;
  messages: Message[];
}

export interface Message {
  role: 'user' | 'assistant';
  text: string;
  citations?: Citation[];
}

export interface Citation {
  sourceId: string;
  page: number;
  snippet: string;
  source: Source | null;
}

export interface MindMapNode {
  id: string;
  label: string;
  type: 'source' | 'concept';
}

export interface MindMapEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface MindMap {
    nodes: MindMapNode[];
    edges: MindMapEdge[];
}
