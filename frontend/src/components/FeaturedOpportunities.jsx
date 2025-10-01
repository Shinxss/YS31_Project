import React from "react";

export default function FeaturedOpportunities() {
  return (
    <section className="py-16 bg-blue-50 text-center">
      <h2 className="section-title">
        Featured <span className="text-orange-500">Opportunities</span>
      </h2>
      <p className="section-subtitle">
        Discover internships from top companies actively hiring students like you.
      </p>

      <div className="flex justify-center gap-6 mt-10 flex-wrap">
        {/* Card 1 */}
        <div className="card w-80 h-[380px] flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg">Software Engineering Intern</h3>
            <p className="text-sm text-gray-500">TechCorp • Dagupan City</p>
            <p className="mt-2 text-sm text-gray-600">
              Work with React and Node.js on real-world projects impacting millions.
            </p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="bg-gray-100 px-2 py-1 rounded text-sm">React</span>
              <span className="bg-gray-100 px-2 py-1 rounded text-sm">JavaScript</span>
              <span className="bg-gray-100 px-2 py-1 rounded text-sm">Node.js</span>
            </div>
          </div>
          <button className="btn-primary mt-4">Apply Now</button>
        </div>

        {/* Card 2 */}
        <div className="card w-80 h-[380px] flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg">Marketing Intern</h3>
            <p className="text-sm text-gray-500">BizWorld • Manila</p>
            <p className="mt-2 text-sm text-gray-600">
              Help grow our online presence with SEO and content strategies.
            </p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="bg-gray-100 px-2 py-1 rounded text-sm">SEO</span>
              <span className="bg-gray-100 px-2 py-1 rounded text-sm">Content</span>
              <span className="bg-gray-100 px-2 py-1 rounded text-sm">Social Media</span>
            </div>
          </div>
          <button className="btn-primary mt-4">Apply Now</button>
        </div>

        {/* Card 3 */}
        <div className="card w-80 h-[380px] flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg">Data Analyst Intern</h3>
            <p className="text-sm text-gray-500">DataWorks • Cebu</p>
            <p className="mt-2 text-sm text-gray-600">
              Analyze real datasets and create dashboards to support business insights.
            </p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="bg-gray-100 px-2 py-1 rounded text-sm">Python</span>
              <span className="bg-gray-100 px-2 py-1 rounded text-sm">SQL</span>
              <span className="bg-gray-100 px-2 py-1 rounded text-sm">Tableau</span>
            </div>
          </div>
          <button className="btn-primary mt-4">Apply Now</button>
        </div>
      </div>

      <button className="btn-outline mt-10">View All Opportunities</button>
    </section>
  );
}
