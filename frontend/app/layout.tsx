export const metadata = {
  title: 'Vibe Calendar',
  description: 'Calendar Shift',
};

import './globals.css';
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}


