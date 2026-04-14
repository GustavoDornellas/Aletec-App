import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata = {
    title: 'Aletec Inventory Control',
    description: 'Aplicacao de controle de estoque para cadastro de produtos, unidades e status de inventario.',
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
