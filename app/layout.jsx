import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
export const metadata = {
    title: 'Industrial Sentinel | Hardware Management',
    description: 'High-precision hardware management and inventory system for industrial electronics.',
};
export default function RootLayout({ children }) {
    return (<html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-[#f4faff] text-[#0a3747] antialiased transition-colors duration-300">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>);
}
