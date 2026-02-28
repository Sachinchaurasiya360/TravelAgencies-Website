import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/shared/structured-data";

export const metadata: Metadata = {
  title: "Track Your Booking - Real-Time Booking Status",
  description:
    "Track your Sarthak Tour and Travels booking status in real-time. Enter your booking ID and registered phone number to view trip details, driver assignment, vehicle information, and journey progress.",
  keywords: [
    "track booking status",
    "cab booking tracker",
    "travel booking status",
    "trip tracking",
    "booking ID lookup",
    "Sarthak Travels booking status",
  ],
  alternates: {
    canonical: "/track",
  },
};

export default function TrackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://sarthaktourandtravels.com" },
          { name: "Track Booking", url: "https://sarthaktourandtravels.com/track" },
        ]}
      />
      {children}
    </>
  );
}
