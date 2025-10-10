import express from "express";
import Student from "../models/student.model.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.get("/me", auth, async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.user.email }).select(
      "firstName lastName email school course major profilePicture bio skills age location contactNumber gender race experience education certification"
    );
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ student });
  } catch (err) {
    console.error("Error fetching student profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/profile", auth, async (req, res) => {
  try {
    const body = req.body;
    const updates = {
      bio: body.bio,
      skills: body.skills,
      age: body.age,
      location: body.location,
      contactNumber: body.contactNumber,
      gender: body.gender,
      race: body.race,
      profilePicture: body.profilePicture,
      course: body.course,
    };

    if (Array.isArray(body.experience)) updates.experience = body.experience;
    if (Array.isArray(body.education)) updates.education = body.education;
    if (Array.isArray(body.certification)) updates.certification = body.certification;

    const student = await Student.findOneAndUpdate(
      { email: req.user.email },
      { $set: updates },
      { new: true, runValidators: true }
    ).select(
      "firstName lastName email school course profilePicture bio skills age location contactNumber gender race experience education certification"
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({
      message: "Profile updated successfully",
      student,
    });
  } catch (err) {
    console.error("Error updating student profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:type/add", auth, async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ["experience", "education", "certification"];

    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    const student = await Student.findOne({ email: req.user.email });
    if (!student) return res.status(404).json({ message: "Student not found" });

    student[type].push(req.body);
    await student.save();

    res.status(201).json({
      message: `${type} added successfully`,
      [type]: student[type],
    });
  } catch (err) {
    console.error("Error adding entry:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:type/:id", auth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const validTypes = ["experience", "education", "certification"];
    if (!validTypes.includes(type))
      return res.status(400).json({ message: "Invalid type" });

    const student = await Student.findOne({ email: req.user.email });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const item = student[type].id(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

  
    Object.assign(item, req.body);
    await student.save();

    res.json({
      message: `${type} updated successfully`,
      [type]: student[type],
    });
  } catch (err) {
    console.error("Error editing entry:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:type/:id", auth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const validTypes = ["experience", "education", "certification"];
    if (!validTypes.includes(type))
      return res.status(400).json({ message: "Invalid type" });

    const student = await Student.findOne({ email: req.user.email });
    if (!student) return res.status(404).json({ message: "Student not found" });

    student[type] = student[type].filter(
      (entry) => entry._id.toString() !== id
    );
    await student.save();

    res.json({
      message: `${type} deleted successfully`,
      [type]: student[type],
    });
  } catch (err) {
    console.error("Error deleting entry:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
