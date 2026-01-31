'use client';

import { usePathname } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { GroupHistoryProvider } from '@/hooks/use-group-history';
import { GroupSidebar } from '@/components/splitease/group-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isGroupPage = pathname.startsWith('/group/');

  return (
    <html lang="zh-TW" className="dark">
      <head>
        <title>付錢啦 - 智慧分帳</title>
        <meta name="description" content="付錢啦 - 輕鬆解決分帳問題" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=Space+Grotesk:wght@300..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <FirebaseClientProvider>
          <GroupHistoryProvider>
            <SidebarProvider>
              <div className="flex">
                {isGroupPage && <GroupSidebar />}
                <main className="flex-1 min-w-0">{children}</main>
              </div>
              <Toaster />
            </SidebarProvider>
          </GroupHistoryProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
