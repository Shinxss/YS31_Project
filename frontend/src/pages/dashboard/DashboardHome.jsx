export default function DashboardHome({ person }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-semibold mb-2">
        Welcome back{person?.firstName ? `, ${person.firstName}!` : "!"}
      </h2>
      <p className="text-gray-600">
        Manage your internship program and track recruitment progress here.
      </p>
    </section>
  );
}
