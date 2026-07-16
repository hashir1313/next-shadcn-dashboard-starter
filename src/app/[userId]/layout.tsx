import { fontVariables } from '@/components/themes/font.config';
import { cn } from '@/lib/utils';
import '../../styles/globals.css';

type PublicLayoutProps = {
  children: React.ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={cn('bg-background min-h-screen font-sans antialiased', fontVariables)}>
        {children}
      </body>
    </html>
  );
}
