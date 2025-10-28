// backend/src/controllers/admin.companyApplications.controller.js
import CompanyEmployees from "../models/companyEmployees.model.js";

/**
 * GET /api/admin/company-applications
 * Fetch all pending company applications (status = "pending")
 */
export const getPendingCompanies = async (req, res) => {
  try {
    const pending = await CompanyEmployees.find({ status: "pending" })
      .select("companyName email city province createdAt industry description")
      .sort({ createdAt: -1 })
      .lean();

    res.json(pending);
  } catch (err) {
    console.error("getPendingCompanies error:", err);
    res.status(500).json({ message: "Failed to fetch company applications" });
  }
};

/**
 * PATCH /api/admin/company-applications/:id/approve
 * Approve a company application
 */
export const approveCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await CompanyEmployees.findByIdAndUpdate(
      id,
      { status: "approved" },
      { new: true }
    );
    if (!updated)
      return res.status(404).json({ message: "Company not found" });

    res.json({ message: "✅ Company approved successfully", company: updated });
  } catch (err) {
    console.error("approveCompany error:", err);
    res.status(500).json({ message: "Failed to approve company" });
  }
};

/**
 * PATCH /api/admin/company-applications/:id/reject
 * Reject a company application
 */
export const rejectCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await CompanyEmployees.findByIdAndUpdate(
      id,
      { status: "rejected" },
      { new: true }
    );
    if (!updated)
      return res.status(404).json({ message: "Company not found" });

    res.json({ message: "❌ Company rejected successfully", company: updated });
  } catch (err) {
    console.error("rejectCompany error:", err);
    res.status(500).json({ message: "Failed to reject company" });
  }
};
