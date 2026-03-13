"use client";

import { motion, type Variants } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    location: "Pune",
    trip: "Family Trip",
    rating: 5,
    text: "Booked a Tempo Traveller for our family trip to Mahabaleshwar. The driver was punctual, vehicle was spotless, and the whole experience was seamless. Highly recommend!",
  },
  {
    name: "Rajesh Patel",
    location: "Pune",
    trip: "Corporate Event",
    rating: 5,
    text: "We've been using Sarthak Travels for all our corporate travel needs. Professional service, well-maintained fleet, and always on time. Best in Pune!",
  },
  {
    name: "Anita Deshmukh",
    location: "Nashik",
    trip: "Pilgrimage",
    rating: 5,
    text: "Booked a bus for our Shirdi pilgrimage group. Everything was perfectly organized — comfortable seats, AC working great, and the driver knew all the routes well.",
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function Testimonials() {
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          className="text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={headingVariants}
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-orange-500">
            What Travelers Say
          </span>
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Real Stories, Real Journeys
          </h2>
        </motion.div>

        <motion.div
          className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={containerVariants}
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={cardVariants}
              whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
              className="relative rounded-2xl border border-gray-100 bg-gray-50 p-8 transition-colors"
            >
              <span className="absolute right-6 top-4 select-none font-serif text-6xl leading-none text-orange-100">
                &ldquo;
              </span>
              <div className="mb-4 flex gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-gray-600">{t.text}</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {t.name}
                  </div>
                  <div className="text-xs text-gray-400">{t.location}</div>
                </div>
                <span className="ml-auto rounded-full bg-orange-50 px-2 py-1 text-xs font-medium text-orange-600">
                  {t.trip}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
