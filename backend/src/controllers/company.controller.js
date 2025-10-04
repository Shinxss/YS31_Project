import User from "../models/user.model.js";
import Company from "../models/company.model.js";
import CompanyEmployees from "../models/companyEmployees.model.js";

/**
 * GET /api/company/me
 */
export const getMe = async (req, res) => {
  try {
    const authUser = await User.findById(req.user.id).lean();
    if (!authUser) return res.status(401).json({ message: "Unauthorized" });
    if (authUser.role !== "company")
      return res.status(403).json({ message: "Forbidden: company only" });

    const companyDoc =
      (await Company.findOne({ email: authUser.email }).lean()) ||
      (await Company.findOne({ userId: authUser._id }).lean());

    const personRole = companyDoc?.companyRole || companyDoc?.role || "Member";

    res.json({
      companyName: companyDoc?.companyName || "Your Company",
      user: {
        firstName: companyDoc?.firstName || authUser.firstName || "",
        lastName: companyDoc?.lastName || authUser.lastName || "",
        role: personRole,
        email: authUser.email,
      },
    });
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/company/validate-name?name=Acme
 * Available = true if:
 *  - no roster doc exists, OR
 *  - roster exists BUT has no owner yet (Owner can claim it)
 */
export const validateCompanyName = async (req, res) => {
  try {
    const raw = req.query.name ?? "";
    const name = String(raw).trim();
    if (!name) return res.status(400).json({ message: "Missing name" });

    const roster = await CompanyEmployees.findOne({ companyName: name })
      .collation({ locale: "en", strength: 2 })
      .lean();

    const available = !roster || !roster.owner; // allow Owner to claim if no owner yet
    return res.json({ available });
  } catch (e) {
    console.error("validateCompanyName error:", e);
    res.status(500).json({ message: "Server error" });
  }
};
