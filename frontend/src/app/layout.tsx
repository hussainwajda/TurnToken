import type { Metadata } from "next";
import { Fraunces, Manrope, Noto_Sans_Devanagari } from "next/font/google";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { getLocale, getT } from "@/i18n/server";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

// Fraunces and Manrope have no Devanagari glyphs; the browser falls back to
// this font character by character for Hindi and Marathi text.
const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari", "latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${manrope.variable} ${devanagari.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink font-body">
        <LocaleProvider locale={locale}>
          {children}
          <LanguageSwitcher className="fixed bottom-4 right-4 z-50 shadow-ticket print:hidden" />
        </LocaleProvider>
      </body>
    </html>
  );
}
