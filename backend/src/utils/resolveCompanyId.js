import CompanyEmployees from "../models/companyEmployees.model.js";


export default async function resolveCompanyId(req) {
  if (req?.user?.companyId) return req.user.companyId;

  const email = req?.user?.email;
  if (!email) return null;

  const doc = await CompanyEmployees.findOne({
    $or: [
      { "owner.email": email },
      { "employees.email": email },
    ],
  }).lean();

  return doc?._id || null;
}
