import Link from "next/link";
import { Header } from "@/components/customer/header";
import { Footer } from "@/components/customer/footer";
import { Phone, MessageCircle, ArrowRight } from "lucide-react";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/917498125466?text=Hi%2C%20I%20want%20to%20enquire%20about%20vehicle%20rental"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-2xl shadow-green-500/30 transition-transform hover:scale-110 md:bottom-6"
        aria-label="Chat on WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-7 w-7"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </a>

      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-200 bg-white md:hidden">
        <a
          href="tel:+917498125466"
          className="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium text-gray-700"
        >
          <Phone className="h-5 w-5" />
          Call
        </a>
        <a
          href="https://wa.me/917498125466?text=Hi%2C%20I%20want%20to%20enquire%20about%20vehicle%20rental"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 flex-col items-center gap-1 border-x border-gray-200 py-3 text-xs font-medium text-green-600"
        >
          <MessageCircle className="h-5 w-5" />
          WhatsApp
        </a>
        <Link
          href="/booking"
          className="flex flex-1 flex-col items-center gap-1 bg-orange-500 py-3 text-xs font-medium text-white"
        >
          <ArrowRight className="h-5 w-5" />
          Book Now
        </Link>
      </div>
    </div>
  );
}
