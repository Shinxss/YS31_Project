import Company from "../../models/company/company.model.js";
import CompanyEmployees from "../../models/company/companyEmployees.model.js";
import path from "path";
import fs from "fs";

// =======================================================
// 🧠 Helper: Save base64 image
// =======================================================
async function saveImage(base64String, folder = "uploads/company") {
  try {
    if (!base64String) return "";
    const dirPath = path.resolve(folder);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

    const matches = base64String.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return "";

    const ext = matches[1].split("/")[1];
    const data = Buffer.from(matches[2], "base64");
    const fileName = `${Date.now()}.${ext}`;
    const filePath = path.join(dirPath, fileName);
    fs.writeFileSync(filePath, data);
    return fileName;
  } catch (err) {
    console.error("❌ saveImage error:", err);
    return "";
  }
}

export const getCompanyProfile = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const userId = req.user?.id;

    const company =
      (await CompanyEmployees.findOne({
        $or: [{ userId }, { "owner.email": userEmail }],
      }).lean()) ||
      (await Company.findOne({ user: userId }).lean());

    if (!company)
      return res.status(404).json({ message: "Company not found" });

    res.json(company);
  } catch (err) {
    console.error("getCompanyProfile error:", err);
    res.status(500).json({ message: "Failed to load company profile" });
  }
};

// =======================================================
// 🧩 POST /api/company/details/save — Update details
// =======================================================
export const updateCompanyProfile = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const userId = req.user?.id;

    const {
      companyName,
      industry,
      description,
      address,
      city,
      province,
      zipCode,
      email,
      website,
      companySize,
      coverPhoto,
      profileImage,
    } = req.body;

    const updateData = {
      industry,
      description,
      address,
      city,
      province,
      zipCode,
      email,
      website,
      companySize,
    };

    // 🧠 Handle image uploads
    if (coverPhoto && coverPhoto.startsWith("data:image/")) {
      const savedCover = await saveImage(coverPhoto, "uploads/company");
      if (savedCover) updateData.coverPhoto = savedCover;
    }
    if (profileImage && profileImage.startsWith("data:image/")) {
      const savedProfile = await saveImage(profileImage, "uploads/company");
      if (savedProfile) updateData.profileImage = savedProfile;
    }

    const updated = await CompanyEmployees.findOneAndUpdate(
      {
        $or: [
          { "owner.email": userEmail },
          { companyName: companyName },
          { userId },
        ],
      },
      { $set: updateData },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Company record not found" });

    // ✅ Sync main Company model (used in job posting & stats)
    await Company.findOneAndUpdate(
      { user: userId },
      { $set: { industry, description, website } },
      { upsert: true }
    );

    res.json({ message: "Company details updated successfully", data: updated });
  } catch (err) {
    console.error("updateCompanyProfile error:", err);
    res.status(500).json({ message: "Failed to save company details" });
  }
};

// =======================================================
// 🧩 GET /api/company/details/:userId — Admin/Company Lookup
// =======================================================
export const getCompanyProfileById = async (req, res) => {
  try {
    const { userId } = req.params;
    const details =
      (await CompanyEmployees.findOne({
        $or: [{ userId }, { "owner.email": req.user?.email }],
      }).lean()) ||
      (await Company.findOne({ user: userId }).lean());

    if (!details)
      return res.status(404).json({ message: "Company details not found" });

    res.json(details);
  } catch (err) {
    console.error("getCompanyProfileById error:", err);
    res.status(500).json({ message: "Failed to fetch company details" });
  }
};
export const getCompanyInfo = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // ✅ Find employee record with company and user link
    const employee = await CompanyEmployees.findOne({ userId })
      .populate("userId", "firstName lastName role") // gets user info
      .lean();

    if (!employee)
      return res.status(404).json({ message: "Company employee not found" });

    res.json({
      companyName: employee.companyName,
      user: {
        firstName: employee.userId.firstName,
        lastName: employee.userId.lastName,
        role: employee.userId.role || employee.role,
      },
    });
  } catch (err) {
    console.error("getCompanyInfo error:", err);
    res.status(500).json({ message: "Failed to fetch company info" });
  }
};
