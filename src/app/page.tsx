import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/customer/header";
import { Footer } from "@/components/customer/footer";
import { Button } from "@/components/ui/button";
import {
  Car,
  Bus,
  Shield,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  ArrowRight,
  Users,
  Headphones,
  IndianRupee,
  Navigation,
  Plane,
  MessageCircle,
  LogIn,
} from "lucide-react";
import { ImageCarousel } from "@/components/customer/image-carousel";
import { Testimonials } from "@/components/customer/testimonials";

export const metadata: Metadata = {
  title: "Sarthak Tour and Travels | Car & Bus Rental in Pune, Maharashtra",
  description:
    "Book reliable car and bus rental services in Pune. Sedan, SUV, Innova, tempo traveller & bus hire for local, outstation, airport transfers & pilgrimages across Maharashtra and India. 24/7 support.",
  keywords: [
    "car rental pune",
    "bus rental pune",
    "tempo traveller hire pune",
    "outstation cab pune",
    "airport transfer pune",
    "innova crysta rental",
    "bus hire maharashtra",
    "sarthak tour and travels",
    "car booking pune",
    "travel agency pune",
  ],
  openGraph: {
    title: "Sarthak Tour and Travels | Car & Bus Rental in Pune",
    description:
      "Premium car and bus rental services in Pune. Sedan, SUV, tempo traveller & bus bookings with professional drivers. 24/7 availability.",
    type: "website",
  },
};

const services = [
  {
    icon: Car,
    title: "Sedan & Hatchback",
    desc: "Swift Dzire, Etios & more for airport transfers and city commutes. Ideal for 1-4 passengers.",
    passengers: "1-4",
  },
  {
    icon: Car,
    title: "SUV & Innova",
    desc: "Innova Crysta, Ertiga & premium SUVs for family trips and outstation travel.",
    passengers: "4-7",
  },
  {
    icon: Users,
    title: "Tempo Traveller",
    desc: "12 to 20-seater tempo travellers — perfect for group trips, pilgrimages & corporate outings.",
    passengers: "12-20",
  },
  {
    icon: Bus,
    title: "Mini Bus & Coach",
    desc: "20 to 50-seater buses for weddings, corporate events, school trips & large group tours.",
    passengers: "20-50",
  },
  {
    icon: Plane,
    title: "Airport Transfer",
    desc: "Reliable pickup and drop to Pune, Mumbai & Nashik airports. Flight tracking included.",
    passengers: "1-7",
  },
  {
    icon: Navigation,
    title: "Outstation Trips",
    desc: "One-way and round-trip cab services to Lonavala, Mahabaleshwar, Shirdi, Goa & all of India.",
    passengers: "1-50",
  },
];

const stats = [
  { value: "10,000+", label: "Trips Completed" },
  { value: "5,000+", label: "Happy Customers" },
  { value: "50+", label: "Vehicles in Fleet" },
  { value: "24/7", label: "Customer Support" },
];

const steps = [
  {
    step: "01",
    icon: MapPin,
    title: "Submit Your Request",
    desc: "Fill in pickup, drop, travel date, vehicle type, and passenger count in our simple booking form.",
  },
  {
    step: "02",
    icon: CheckCircle2,
    title: "Get Confirmation",
    desc: "Our team reviews your request, assigns the best vehicle, and confirms your booking with transparent pricing.",
  },
  {
    step: "03",
    icon: Car,
    title: "Enjoy Your Journey",
    desc: "Your vehicle arrives on time with a professional driver. Sit back, relax, and enjoy a comfortable ride.",
  },
];

const whyUs = [
  {
    icon: Shield,
    title: "Safe & Reliable",
    desc: "All vehicles GPS-tracked and regularly serviced. Verified, experienced drivers you can trust.",
  },
  {
    icon: Clock,
    title: "Always On Time",
    desc: "Punctual pickups and drops with real-time tracking. We value your time as much as you do.",
  },
  {
    icon: IndianRupee,
    title: "Transparent Pricing",
    desc: "No hidden charges, no surge pricing. What you see is what you pay, with GST-compliant invoices.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    desc: "Round-the-clock assistance via call, SMS, and WhatsApp. We're always just a message away.",
  },
];

const popularRoutes = [
  "Pune to Mumbai",
  "Pune to Lonavala",
  "Pune to Shirdi",
  "Pune to Mahabaleshwar",
  "Pune to Goa",
  "Pune to Nashik",
  "Pune to Alibaug",
  "Pune Airport Transfer",
];


export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 px-4 pb-20 pt-16 text-white md:pb-32 md:pt-24">
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-orange-500 blur-[120px]" />
          <div className="absolute -bottom-20 right-0 h-60 w-60 rounded-full bg-blue-500 blur-[100px]" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(249,115,22,0.08),transparent_60%)]" />

        <div className="container relative z-10 mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="mb-4 inline-block rounded-full bg-orange-500/10 px-4 py-1.5 text-sm font-semibold text-orange-400 ring-1 ring-orange-500/20">
                Pune&apos;s Trusted Travel Partner
              </span>
              <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                Your Journey,{" "}
                <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
                  Our Commitment
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-300">
                Premium car &amp; bus rental services across Maharashtra and India.
                Professional drivers, well-maintained fleet, and transparent pricing
                — available 24/7.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Button
                  size="lg"
                  className="bg-orange-500 text-white shadow-lg shadow-orange-500/25 hover:bg-orange-600"
                  asChild
                >
                  <Link href="/booking">
                    Book Your Trip <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-orange-500 bg-transparent text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
                  asChild
                >
                  <Link href="/track">Track Booking</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-transparent text-gray-300 hover:bg-white/5 hover:text-white"
                  asChild
                >
                  <Link href="/admin/login">
                    <LogIn className="mr-2 h-4 w-4" /> Admin Login
                  </Link>
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-gray-400">
                <a
                  href="tel:+917498125466"
                  className="flex items-center gap-2 transition-colors hover:text-orange-400"
                >
                  <Phone className="h-4 w-4" />
                  +91 74981 25466
                </a>
                <a
                  href="https://wa.me/917498125466?text=Hi%2C%20I%20want%20to%20enquire%20about%20vehicle%20rental"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition-colors hover:text-green-400"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Us
                </a>
              </div>
            </div>

            {/* Quick stats in hero */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                  >
                    <div className="text-3xl font-extrabold text-orange-400">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile stats band */}
      <section className="border-b bg-gray-900 px-4 py-8 lg:hidden">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-extrabold text-orange-400">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="px-4 py-16 md:py-24" id="services">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-orange-500">
              What We Offer
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Our Fleet &amp; Services
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-500">
              From compact city sedans to 50-seater luxury coaches — we have the
              right vehicle for every journey across Maharashtra and India.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.title}
                className="group rounded-2xl border border-gray-100 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 transition-transform duration-300 group-hover:scale-110">
                  <service.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-gray-900">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {service.desc}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600">
                    {service.passengers} passengers
                  </span>
                  <Link
                    href="/booking"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-orange-500 transition-all hover:gap-2"
                  >
                    Book <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-orange-500">
              Simple Process
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Book Your Ride in 3 Steps
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((item, idx) => (
              <div key={item.step} className="relative text-center">
                {/* Connecting line */}
                {idx < steps.length - 1 && (
                  <div className="absolute left-1/2 top-8 hidden h-0.5 w-full bg-gradient-to-r from-orange-300 to-orange-100 md:block" />
                )}
                <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-lg font-bold text-white shadow-lg shadow-orange-500/25">
                  {item.step}
                </div>
                <h3 className="mt-6 text-lg font-bold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="text-sm font-semibold uppercase tracking-widest text-orange-500">
                Why Sarthak Travels
              </span>
              <h2 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Trusted by Thousands Across Maharashtra
              </h2>
              <p className="mt-4 text-gray-500">
                With over a decade of experience in the travel industry, we&apos;ve
                built our reputation on reliability, comfort, and customer satisfaction.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {whyUs.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-gray-100 bg-white p-6 transition-shadow hover:shadow-lg"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                    <item.icon className="h-5 w-5 text-orange-500" />
                  </div>
                  <h3 className="mt-4 font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Band */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-16">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl font-extrabold text-orange-400 sm:text-5xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm uppercase tracking-wider text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Popular Routes */}
      <section className="bg-gray-50 px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-orange-500">
              Where We Go
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Popular Routes from Pune
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-500">
              We cover all major destinations across Maharashtra and beyond. Book
              your ride to any city in India.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {popularRoutes.map((route) => (
              <Link
                key={route}
                href="/booking"
                className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
              >
                {route}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Image Gallery Carousel */}
      <ImageCarousel />

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-16 md:py-20">
        <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 text-center lg:flex-row lg:text-left">
          <div>
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Ready to Hit the Road?
            </h2>
            <p className="mt-3 max-w-lg text-orange-100">
              Get an instant quote with no hidden charges. Available 24/7 across
              Pune and all of Maharashtra.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button
              size="lg"
              className="bg-white font-bold text-orange-600 shadow-lg hover:bg-orange-50"
              asChild
            >
              <Link href="/booking">
                Book Online <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              className="border-2 border-white/30 bg-transparent text-white hover:bg-white/10"
              asChild
            >
              <a href="tel:+917498125466">
                <Phone className="mr-2 h-5 w-5" />
                Call Now
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/917498125466?text=Hi%2C%20I%20want%20to%20enquire%20about%20vehicle%20rental"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-2xl shadow-green-500/30 transition-transform hover:scale-110"
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

      <Footer />
    </div>
  );
}
