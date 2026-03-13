"use client";

import Image from "next/image";

const images = [
  "/WhatsApp Image 2026-03-05 at 10.00.25 PM.jpeg",
  "/WhatsApp Image 2026-03-05 at 10.00.25 PM (1).jpeg",
  "/WhatsApp Image 2026-03-05 at 10.03.40 PM.jpeg",
  "/WhatsApp Image 2026-03-05 at 10.03.40 PM (1).jpeg",
];

// Double the images for seamless infinite scroll
const allImages = [...images, ...images];

export function ImageCarousel() {
  return (
    <section className="overflow-hidden bg-gray-50 py-12 md:py-16">
      <div className="text-center mb-8">
        <span className="text-sm font-semibold uppercase tracking-widest text-orange-500">
          Our Fleet in Action
        </span>
        <h2 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Gallery
        </h2>
      </div>
      <div className="relative">
        <div className="flex animate-slide-left gap-6">
          {allImages.map((src, i) => (
            <div
              key={i}
              className="relative h-64 w-96 flex-shrink-0 overflow-hidden rounded-2xl shadow-lg md:h-80 md:w-[480px]"
            >
              <Image
                src={src}
                alt={`Fleet image ${(i % images.length) + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 384px, 480px"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
