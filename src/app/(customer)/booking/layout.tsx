import type { Metadata } from "next";
import {
  ServiceSchema,
  BreadcrumbSchema,
} from "@/components/shared/structured-data";

export const metadata: Metadata = {
  title: "Book a Trip - Car & Bus Rental Booking",
  description:
    "Book your car or bus rental online with Sarthak Tour and Travels. Choose from sedan, SUV, Innova Crysta, tempo traveller, or bus. Easy online booking for local trips, outstation travel, airport transfers, and pilgrimages across Mumbai and Maharashtra.",
  keywords: [
    "book cab online Mumbai",
    "car rental booking",
    "bus booking online",
    "tempo traveller booking Mumbai",
    "outstation cab booking",
    "airport transfer booking Mumbai",
    "SUV rental booking",
    "Innova Crysta booking",
    "wedding car booking Mumbai",
    "corporate travel booking",
  ],
  alternates: {
    canonical: "/booking",
  },
};

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ServiceSchema />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://sarthaktourandtravels.com" },
          { name: "Book a Trip", url: "https://sarthaktourandtravels.com/booking" },
        ]}
      />
      {children}
    </>
  );
}
