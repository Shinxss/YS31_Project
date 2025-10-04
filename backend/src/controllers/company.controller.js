import User from "../models/user.model.js";
import Company from "../models/company.model.js";

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
        lastName:  companyDoc?.lastName  || authUser.lastName  || "",
        role: personRole,
        email: authUser.email,
      },
    });
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
