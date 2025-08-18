
'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUp, Loader2, Youtube, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UploadDialogProps {
  onUpload: (source: { type: 'file', content: File } | { type: 'youtube', content: string } | { type: 'website', content: string }) => void;
  isUploading: boolean;
}

export function UploadDialog({ onUpload, isUploading }: UploadDialogProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = React.useState('');
  const [websiteUrl, setWebsiteUrl] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        toast({
            variant: 'destructive',
            title: 'Invalid File Type',
            description: 'Please upload a PDF, TXT, or DOCX file.',
        });
        setSelectedFile(null);
      }
    }
  };

  const handleUploadClick = (type: 'file' | 'youtube' | 'website') => {
    if (type === 'file' && selectedFile) {
      onUpload({ type: 'file', content: selectedFile });
    } else if (type === 'youtube' && youtubeUrl) {
      onUpload({ type: 'youtube', content: youtubeUrl });
    } else if (type === 'website' && websiteUrl) {
      onUpload({ type: 'website', content: websiteUrl });
    }
    setIsOpen(false);
    setSelectedFile(null);
    setYoutubeUrl('');
    setWebsiteUrl('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full justify-start gap-2">
          <FileUp className="size-4" />
          <span className="font-headline">Add Source</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">Add a New Source</DialogTitle>
          <DialogDescription className="font-body">
            Upload a document, or add a YouTube video or website link.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file"><FileUp className="mr-2 h-4 w-4" />File</TabsTrigger>
            <TabsTrigger value="youtube"><Youtube className="mr-2 h-4 w-4" />YouTube</TabsTrigger>
            <TabsTrigger value="website"><LinkIcon className="mr-2 h-4 w-4" />Website</TabsTrigger>
          </TabsList>
          <TabsContent value="file">
            <div className="grid gap-4 py-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="document" className="font-headline">Document</Label>
                <Input id="document" type="file" onChange={handleFileChange} accept=".pdf,.txt,.docx" />
              </div>
            </div>
            <Button onClick={() => handleUploadClick('file')} disabled={!selectedFile || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload and Index'
              )}
            </Button>
          </TabsContent>
          <TabsContent value="youtube">
            <div className="grid gap-4 py-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="youtube" className="font-headline">YouTube URL</Label>
                <Input id="youtube" type="url" placeholder="https://www.youtube.com/watch?v=..." value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} />
              </div>
            </div>
            <Button onClick={() => handleUploadClick('youtube')} disabled={!youtubeUrl || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add YouTube Video'
              )}
            </Button>
          </TabsContent>
          <TabsContent value="website">
            <div className="grid gap-4 py-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="website" className="font-headline">Website URL</Label>
                <Input id="website" type="url" placeholder="https://example.com" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}/>
              </div>
            </div>
            <Button onClick={() => handleUploadClick('website')} disabled={!websiteUrl || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Website'
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
