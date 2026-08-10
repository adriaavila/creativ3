import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";

export default async function LocaleHome({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  redirect(locale === "en" ? "/en/whatsapp" : "/");
}
