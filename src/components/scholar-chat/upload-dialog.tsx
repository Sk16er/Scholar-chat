
'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadDialogProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export function UploadDialog({ onUpload, isUploading }: UploadDialogProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
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

  const handleUploadClick = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      setIsOpen(false);
      setSelectedFile(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full justify-start gap-2">
          <FileUp className="size-4" />
          <span className="font-headline">Upload Document</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">Upload a Document</DialogTitle>
          <DialogDescription className="font-body">
            Select a PDF, TXT, or DOCX file to add to your project.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="document" className="font-headline">Document</Label>
            <Input id="document" type="file" onChange={handleFileChange} accept=".pdf,.txt,.docx" />
          </div>
        </div>
        <Button onClick={handleUploadClick} disabled={!selectedFile || isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload and Index'
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
