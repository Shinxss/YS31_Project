import React from "react";

export default function CTASection() {
  return (
    <section className="py-20 bg-blue-50 text-center">
      <h2 className="section-title">
        Ready to <span className="text-orange-500">Get Started?</span>
      </h2>
      <p className="section-subtitle">
        Join thousands of students and companies who have found success through InternConnect.
      </p>

      <div className="flex flex-col md:flex-row justify-center gap-8 mt-12 px-6">
        <div className="card w-96 h-64 flex flex-col justify-between p-8 text-left">
          <div>
            <h3 className="font-bold text-xl">For Students</h3>
            <p className="text-sm text-gray-600 mt-3">
              Create your profile and start applying to internships from top companies.
            </p>
          </div>
          <button className="btn-primary mt-6 w-full">Start your journey →</button>
        </div>

        <div className="card w-96 h-64 flex flex-col justify-between p-8 text-left">
          <div>
            <h3 className="font-bold text-xl">For Companies</h3>
            <p className="text-sm text-gray-600 mt-3">
              Connect with students from top universities. Post your first job now.
            </p>
          </div>
          <button className="btn-outline mt-6 w-full">Post your First Job →</button>
        </div>
      </div>
    </section>
  );
}
