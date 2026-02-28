import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/shared/structured-data";

export const metadata: Metadata = {
  title: "Contact Us - Sarthak Tour and Travels Mumbai",
  description:
    "Contact Sarthak Tour and Travels in Mumbai, Maharashtra. Call +91 7070416209 or email mrsachinchaurasiya@gmail.com for car rental, bus booking, and travel inquiries. Available 24/7 for all your transportation needs.",
  keywords: [
    "contact Sarthak Travels",
    "car rental contact Mumbai",
    "travel agency phone number Mumbai",
    "bus booking inquiry",
    "Mumbai travel agency contact",
    "taxi service contact Mumbai",
    "transportation service Mumbai",
    "travel helpline Mumbai",
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
