
import { BookOpenCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 text-primary', className)}>
      <BookOpenCheck className="size-6" />
      <h1 className="text-xl font-bold font-headline">ScholarChat</h1>
    </div>
  );
}
