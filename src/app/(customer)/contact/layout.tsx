import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/shared/structured-data";

export const metadata: Metadata = {
  title: "Contact Us - Sarthak Tour and Travels Pune",
  description:
    "Contact Sarthak Tour and Travels in Pune, Maharashtra. Call +91 7498125466 or email sarthaktourandtravelpune@gmail.com for car rental, bus booking, and travel inquiries. Available 24/7 for all your transportation needs.",
  keywords: [
    "contact Sarthak Travels",
    "car rental contact Pune",
    "travel agency phone number Pune",
    "bus booking inquiry",
    "Pune travel agency contact",
    "taxi service contact Pune",
    "transportation service Pune",
    "travel helpline Pune",
  ],
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://sarthaktourandtravels.com" },
          { name: "Contact Us", url: "https://sarthaktourandtravels.com/contact" },
        ]}
      />
      {children}
    </>
  );
}
