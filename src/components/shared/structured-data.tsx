export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: "Sarthak Tour and Travels",
    description:
      "Premium car and bus rental services in Mumbai, Maharashtra. Sedan, SUV, tempo traveller, and bus bookings for local and outstation travel.",
    url: "https://sarthaktourandtravels.com",
    telephone: "+917070416209",
    email: "mrsachinchaurasiya@gmail.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Mumbai",
      addressRegion: "Maharashtra",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "19.0760",
      longitude: "72.8777",
    },
    areaServed: [
      { "@type": "State", name: "Maharashtra" },
      { "@type": "Country", name: "India" },
    ],
    priceRange: "$$",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "00:00",
      closes: "23:59",
    },
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteSchema() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://sarthaktourandtravels.com";

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Sarthak Tour and Travels",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/booking?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FAQSchema({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ServiceSchema() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://sarthaktourandtravels.com";

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Transportation Service",
    provider: {
      "@type": "TravelAgency",
      name: "Sarthak Tour and Travels",
      url: baseUrl,
    },
    areaServed: {
      "@type": "State",
      name: "Maharashtra",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Vehicle Rental Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Sedan Car Rental",
            description:
              "Comfortable sedan cars for local and outstation travel in Mumbai and Maharashtra.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "SUV Car Rental",
            description:
              "Spacious SUV vehicles for family trips, group travel, and hill station tours.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Tempo Traveller Rental",
            description:
              "Tempo traveller on rent for group outings, pilgrimages, and corporate events.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Bus Rental",
            description:
              "Bus booking for large groups, weddings, corporate events, and long-distance travel across India.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Innova Crysta Rental",
            description:
              "Premium Innova Crysta on rent for comfortable outstation and airport transfer services.",
          },
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
