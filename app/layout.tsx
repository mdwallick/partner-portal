import { Toaster } from 'react-hot-toast';
import './globals.css';
import TokenDebugger from './components/TokenDebugger';
import NavigationLogger from './components/NavigationLogger';

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'Partner Portal',
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Streaming Platform Partner Portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Log when layout renders
  console.log('\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n');
  console.log('🔄 Root Layout Rendered');
  
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" />
        <TokenDebugger />
        <NavigationLogger />
      </body>
    </html>
  );
} 