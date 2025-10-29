import Student from "../models/student.model.js";
import mongoose from "mongoose";

export const getStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await Student.findOne({ user: userId });

    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json({ student });
  } catch (err) {
    console.error("Fetch student profile error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update Student Profile
export const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await Student.findOne({ user: userId });

    if (!student) return res.status(404).json({ message: "Student not found" });

    const updatable = [
      "bio",
      "skills",
      "age",
      "location",
      "contactNumber",
      "gender",
      "race",
      "profilePicture",
      "experience",
      "education",
      "certification",
    ];

    for (const key of updatable) {
      if (req.body[key] !== undefined) student[key] = req.body[key];
    }

    await student.save();
    res.json({ message: "Profile updated successfully", student });
  } catch (err) {
    console.error("Update student profile error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



export const getStudentProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    // Only select safe, non-sensitive fields
    const student = await Student.findById(id)
      .select(
        "firstName lastName email profilePicture bio skills course education"
      )
      .lean();

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // derive a top-level "fullName" and "school" for convenience
    const fullName =
      student.fullName ||
      [student.firstName, student.lastName].filter(Boolean).join(" ");

    // your schema stores school under education[]; take the most recent one if present
    let school = "";
    if (Array.isArray(student.education) && student.education.length > 0) {
      // pick the last item or the one with the latest endDate
      const sorted = [...student.education].sort((a, b) => {
        // try parsing YYYY-MM or YYYY values; fallback keeps order
        const pa = Date.parse(a?.endDate || "") || 0;
        const pb = Date.parse(b?.endDate || "") || 0;
        return pb - pa;
      });
      school = sorted[0]?.school || "";
    }

    // shape exactly what the UI needs
    return res.json({
      _id: id,
      fullName,
      course: student.course || "",
      school,
      skills: Array.isArray(student.skills) ? student.skills : [],
      bio: student.bio || "",
      profilePicture: student.profilePicture || "",
      // include these if you later store resume locations alongside student
      resumeUrl: student.resumeUrl || null,
      resumeText: student.resumeText || null,
      // optional: email if you want it visible
      // email: student.email,
    });
  } catch (err) {
    console.error("getStudentProfileById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


// Add Reminder (accepts flat or nested payloads)
export const addReminder = async (req, res) => {
  try {
    const userId = req.user.id;

    // Accept both shapes:
    //    - flat: { title, description, date, time, type, datetime }
    //    - nested: { reminder: { ...same fields... } }
    const src = req.body?.reminder ? req.body.reminder : req.body;

    const title = (src?.title || "").trim();
    const description = (src?.description || "").trim();
    const date = src?.date || "";
    const time = src?.time || "";
    const type = src?.type || "Other";
    let datetime = src?.datetime;

    if (!title || !date || !time) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!datetime && date) {
      const dt = new Date(`${date}T${time || "00:00"}`);
      if (!isNaN(dt.getTime())) datetime = dt;
    }

    const student = await Student.findOne({ user: userId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const reminder = {
      title,
      description,
      date,
      time,
      type,
      // these two are additive — your schema is flexible and will store them
      datetime: datetime || null,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    student.reminders = Array.isArray(student.reminders) ? student.reminders : [];
    student.reminders.push(reminder);
    await student.save();

    res
      .status(201)
      .json({ message: "Reminder added successfully", reminder, reminders: student.reminders });
  } catch (err) {
    console.error("Add reminder error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

//Fetch Reminders (sorted soonest first for Upcoming Events)
export const getReminders = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await Student.findOne({ user: userId });

    if (!student) return res.status(404).json({ message: "Student not found" });

    const list = Array.isArray(student.reminders) ? [...student.reminders] : [];
    list.sort((a, b) => {
      const ad = a.datetime ? new Date(a.datetime).getTime() : new Date(`${a.date}T${a.time || "00:00"}`).getTime();
      const bd = b.datetime ? new Date(b.datetime).getTime() : new Date(`${b.date}T${b.time || "00:00"}`).getTime();
      return ad - bd;
    });

    res.json(list);
  } catch (err) {
    console.error("Fetch reminders error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



const pickSchool = (education = []) => {
  if (!Array.isArray(education) || education.length === 0) return "";
  const last = education[education.length - 1];
  return last?.school || education.find(e => e?.school)?.school || "";
};

export async function getStudentPublicProfile(req, res) {
  try {
    const { id } = req.params;

    let s = null;
    if (mongoose.isValidObjectId(id)) {
      // try by Student _id first
      s = await Student.findById(id)
        .select("firstName lastName email profilePicture course school skills bio education experience certification contactNumber location age gender race")
        .lean();
    }

    // fallback: if not found, try as user id
    if (!s && mongoose.isValidObjectId(id)) {
      s = await Student.findOne({ user: id })
        .select("firstName lastName email profilePicture course school skills bio education experience certification contactNumber location age gender race")
        .lean();
    }

    if (!s) return res.status(404).json({ message: "Student not found" });

    const school = s.school || pickSchool(s.education);

    return res.json({
      _id: s._id,
      firstName: s.firstName,
      lastName: s.lastName,
      fullName: [s.firstName, s.lastName].filter(Boolean).join(" "),
      email: s.email,
      profilePicture: s.profilePicture || "",
      course: s.course || "",
      school,
      skills: Array.isArray(s.skills) ? s.skills : [],
      bio: s.bio || "",
      experience: Array.isArray(s.experience) ? s.experience : [],
      education: Array.isArray(s.education) ? s.education : [],
      certification: Array.isArray(s.certification) ? s.certification : [],
      contactNumber: s.contactNumber || "",
      location: s.location || "",
      age: s.age || "",
      gender: s.gender || "",
      race: s.race || "",
    });
  } catch (err) {
    console.error("getStudentPublicProfile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
export const updateReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reminderId } = req.params;

    if (!mongoose.isValidObjectId(reminderId)) {
      return res.status(400).json({ message: "Invalid reminder id" });
    }

    const src = req.body?.reminder ? req.body.reminder : req.body;
    const toSet = {};

    // only update provided fields
    ["title", "description", "date", "time", "type", "datetime", "status"].forEach((k) => {
      if (src[k] !== undefined) toSet[`reminders.$.${k}`] = src[k];
    });
    // always bump updatedAt
    toSet["reminders.$.updatedAt"] = new Date();

    const doc = await Student.findOneAndUpdate(
      { user: userId, "reminders._id": reminderId },
      { $set: toSet },
      { new: true, projection: { reminders: 1 } }
    );

    if (!doc) return res.status(404).json({ message: "Reminder not found" });

    const updated = doc.reminders.id(reminderId);
    return res.json({ message: "Reminder updated", reminder: updated, reminders: doc.reminders });
  } catch (err) {
    console.error("Update reminder error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/** DELETE /students/me/reminders/:reminderId */
export const deleteReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reminderId } = req.params;

    if (!mongoose.isValidObjectId(reminderId)) {
      return res.status(400).json({ message: "Invalid reminder id" });
    }

    const doc = await Student.findOneAndUpdate(
      { user: userId },
      { $pull: { reminders: { _id: reminderId } } },
      { new: true, projection: { reminders: 1 } }
    );

    if (!doc) return res.status(404).json({ message: "Student not found" });

    return res.json({ message: "Reminder deleted", reminders: doc.reminders });
  } catch (err) {
    console.error("Delete reminder error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
  