import CompanyEmployees from "../../models/company/companyEmployees.model.js";
export const validateCompanyName = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name)
      return res.status(400).json({ message: "Missing company name" });

    const exists = await CompanyEmployees.findOne({
      companyName: { $regex: new RegExp(`^${name}$`, "i") },
    });

    res.json({ exists: !!exists });
  } catch (err) {
    console.error("validateCompanyName error:", err);
    res.status(500).json({ message: "Failed to validate name" });
  }
};
