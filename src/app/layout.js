import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UpdatesProvider } from '@/contexts/UpdatesContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { GameSettingsProvider } from '@/contexts/GameSettingsContext'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Unprofessional Players - Ganesh Chaturthi",
  description: "Experience the thrill of ganesh chaturthi with our interactive challenges. Test your skills, compete with friends, and discover amazing prizes!",
  openGraph: {
    title: "Unprofessional Players - Ganesh Chaturthi",
    description: "Experience the thrill of ganesh chaturthi with our interactive challenges. Test your skills, compete with friends, and discover amazing prizes!",
    images: [
      {
        url: '/ganesha.png',
        width: 1200,
        height: 630,
        alt: 'Unprofessional Players - Ganesh Chaturthi Logo',
      },
    ],
    type: 'website',
    siteName: 'Unprofessional Players - Ganesh Chaturthi',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Unprofessional Players - Ganesh Chaturthi",
    description: "Experience the thrill of ganesh chaturthi with our interactive challenges. Test your skills, compete with friends, and discover amazing prizes!",
    images: ['/ganesha.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UpdatesProvider>
          <LanguageProvider>
            <GameSettingsProvider>
              {children}
            </GameSettingsProvider>
          </LanguageProvider>
        </UpdatesProvider>
      </body>
    </html>
  );
}
