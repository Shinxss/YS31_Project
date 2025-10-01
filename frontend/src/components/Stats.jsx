import React from "react";

export default function Stats() {
  const stats = [
    { number: "10K+", label: "Active Students" },
    { number: "2K+", label: "Companies" },
    { number: "5K+", label: "Internships" },
    { number: "95%", label: "Success Rate" },
  ];

  return (
    <section className="py-12 bg-blue-50">
      <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-10 text-center">
        {stats.map((stat, i) => (
          <div key={i}>
            <h3 className="text-3xl font-bold text-blue-900">{stat.number}</h3>
            <p className="text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
