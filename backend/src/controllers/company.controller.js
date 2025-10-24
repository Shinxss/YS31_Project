import Company from "../models/company.model.js";
import CompanyEmployees from "../models/companyEmployees.model.js";
import path from "path";
import fs from "fs";
import resolveCompanyId from "../utils/resolveCompanyId.js";

// =======================================================
// 🧩 1️⃣ Helper: Save base64 or file buffer uploads like Profile page
// =======================================================
async function saveImage(base64String, folder = "uploads/company") {
  try {
    if (!base64String) return "";

    // ensure folder exists
    const dirPath = path.resolve(folder);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

    // extract file extension & data
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

// =======================================================
// 🧩 2️⃣ GET /api/company/me
// =======================================================
export const getMe = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId)
      return res.status(401).json({ message: "Unauthorized — no user ID" });

    const companyUser = await Company.findOne({ user: userId }).lean();
    const companyDetails = await CompanyEmployees.findOne({
      $or: [{ userId }, { "owner.email": req.user.email }],
    }).lean();

    if (!companyUser && !companyDetails)
      return res.status(404).json({ message: "Company not found" });

    res.json({
      ...companyUser,
      ...companyDetails,
      user: {
        firstName: companyUser?.firstName || companyDetails?.owner?.firstName || "",
        lastName: companyUser?.lastName || companyDetails?.owner?.lastName || "",
        role: companyUser?.role || companyDetails?.owner?.role || "",
        email: companyUser?.email || companyDetails?.owner?.email || "",
      },
    });
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ message: "Failed to fetch company info" });
  }
};

// =======================================================
// 🧩 3️⃣ POST /api/company/details/save
// =======================================================
export const saveCompanyDetails = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const userEmail = req.user?.email;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

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

    // 🧠 Save images if base64 is provided
    if (coverPhoto && coverPhoto.startsWith("data:image/")) {
      const savedCover = await saveImage(coverPhoto, "uploads/company");
      if (savedCover) updateData.coverPhoto = savedCover;
    }
    if (profileImage && profileImage.startsWith("data:image/")) {
      const savedProfile = await saveImage(profileImage, "uploads/company");
      if (savedProfile) updateData.profileImage = savedProfile;
    }

    // ✅ Only update existing record — never insert new
    const companyDoc = await CompanyEmployees.findOneAndUpdate(
      {
        $or: [
          { "owner.email": userEmail },
          { userId },
          { companyName: companyName },
        ],
      },
      { $set: updateData },
      { new: true }
    );

    if (!companyDoc) {
      return res.status(404).json({
        message: "Existing company not found — please check your account",
      });
    }

    // ✅ Sync key fields with main Company model
    await Company.findOneAndUpdate(
      { user: userId },
      { $set: { industry: industry } },
      { new: true }
    );

    console.log("✅ Updated company:", companyDoc.companyName);
    res.json({
      message: "Company details updated successfully",
      data: companyDoc,
    });
  } catch (err) {
    console.error("saveCompanyDetails error:", err);
    res.status(500).json({
      message: err?.message || "Failed to save company details",
    });
  }
};

// =======================================================
// 🧩 4️⃣ GET /api/company/details/:userId
// =======================================================
export const getCompanyDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const details = await CompanyEmployees.findOne({ userId }).lean();
    if (!details)
      return res.status(404).json({ message: "Company details not found" });
    res.json(details);
  } catch (err) {
    console.error("getCompanyDetails error:", err);
    res.status(500).json({ message: "Failed to fetch company details" });
  }
};

// =======================================================
// 🧩 5️⃣ GET /api/company/validate-name
// =======================================================
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

export async function listCompanyJobs(req, res) {
  try {
    const companyId = await resolveCompanyId(req);
    if (!companyId) return res.status(403).json({ message: "Company not found for user." });

    const jobs = await Job.find({
      $or: [
        { companyId: companyId },                    // when Job.companyId = CompanyEmployees _id
        { "companyId._id": companyId },              // when populated/embedded
      ],
    })
    .sort({ createdAt: -1 })
    .lean();

    res.json(jobs);
  } catch (err) {
    console.error("listCompanyJobs error:", err);
    res.status(500).json({ message: "Failed to fetch company jobs" });
  }
}