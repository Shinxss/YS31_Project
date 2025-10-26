// src/utils/companyContext.js
import Company from "../models/company.model.js";
import CompanyEmployees from "../models/companyEmployees.model.js"; // collection you showed (company_employees)

export async function getCompanyForUser(req) {
  const uid = req.user?.id;
  const email = (req.user?.email || "").toLowerCase();

  // Owner path (Company.user === req.user.id) or by email on Company
  const ownerCompany =
    (uid && (await Company.findOne({ user: uid }))) ||
    (email && (await Company.findOne({ email })));

  if (ownerCompany) return ownerCompany;

  // Employee path: find record where this email is in employees[] or owner.email
  if (!email) return null;
  const empDoc = await CompanyEmployees.findOne({
    $or: [
      { "employees.email": email },
      { "owner.email": email },
      { email }, // in case you also store a top-level email
    ],
  }).lean();

  if (!empDoc) return null;

  // map by companyName back to Company
  const byName =
    empDoc.companyName &&
    (await Company.findOne({ companyName: empDoc.companyName }));

  return byName || null;
}
