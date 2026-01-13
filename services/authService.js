import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

class AuthService {
    generateToken(user) {
        return jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
    }

    async register({ username, email, password }) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const error = new Error("Email already in use");
            error.statusCode = 400;
            throw error;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
        });

        const token = this.generateToken(user);
        const userObj = user.toObject();
        delete userObj.password;

        return { user: userObj, token };
    }

    async login({ email, password }) {
        const user = await User.findOne({ email });
        if (!user) {
            const error = new Error("Invalid credentials");
            error.statusCode = 401; // Security best practice: generic message
            throw error;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            const error = new Error("Invalid credentials");
            error.statusCode = 401;
            throw error;
        }

        const token = this.generateToken(user);
        const userObj = user.toObject();
        delete userObj.password;

        return { user: userObj, token };
    }

    async getProfile(userId) {
        const user = await User.findById(userId).select("-password").lean();
        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }
        return user;
    }

    async updateProfile(userId, updateData, file) {
        const updateFields = {};
        const { username, email, password, bio, facebook, linkedin, whatsapp } = updateData;

        if (username) updateFields.username = username;
        if (email) updateFields.email = email;
        if (bio !== undefined) updateFields.bio = bio;

        if (password) {
            updateFields.password = await bcrypt.hash(password, 10);
        }

        // Social links update logic
        if (facebook || linkedin || whatsapp) {
            // We need to fetch the user first if we want to merge deep properties gracefully 
            // OR rely on dot notation if we want to update specific fields without overwriting the whole object.
            // Mongoose findByIdAndUpdate with dot notation is safer for partial updates if structured that way.
            // But for simplicity/logic migration, let's keep it clean.
            // Assuming socialLinks is the object name in Schema based on previous view_file (it was 'socialLinks' in schema but 'social' in controller logic?)
            // Let's verify schema again. Schema said: socialLinks: { facebook... }
            // Controller said: social: { ... } -> This implies the old controller might have been buggy or I misread.
            // I will check Scheme again in my memory or tool output.
            // Step 29 output: socialLinks: { facebook: ..., linkedin: ..., whatsapp: ... }
            // Step 24 output (Controller): social: { facebook: ... }
            // The controller was trying to update `social` but the schema has `socialLinks`. 
            // This confirms a bug fix is needed!

            updateFields.socialLinks = {
                facebook: facebook || undefined,
                linkedin: linkedin || undefined,
                whatsapp: whatsapp || undefined
            };
            // Note: Using undefined to avoid overwriting with empty strings if not provided? 
            // Or should we merge? 
            // The original controller logic merged with req.user.social.
            // I will implement merge logic here if I can fetch user, or pass current user down.
        }

        if (file && file.path) {
            updateFields.avatar = file.path; // Schema has avatar: String (url)
            // The schema also had 'profileImage' object?
            // Step 29: avatar: {type:String...}, profileImage: { type: String ... } ?
            // Step 29 output showed strange formatting.
            /*
              9:     avatar:{type:String,default:"..."},
              10:     bio: { type: String, default: "" },
              11:     profileImage
              12: : {
              13:       type: String, ...
            */
            // It seems both exist? I'll stick to 'avatar' as primary for now or check usage.
            // Controller used `updateFields.avatar = { url: ..., public_id: ... }`
            // But Schema at line 9 says `avatar: {type:String}`.
            // This suggests a Schema mismatch or Cloudinary Plugin usage that wasn't visible?
            // Or maybe the controller was wrong.
            // I will trust the Schema: `avatar` is a String URL.
            // Wait, line 86 in controller: `updateFields.avatar = { url: ..., public_id: ... }`.
            // If Schema defines avatar as String, Mongoose might just cast it to string (url) if it's the first cache, or fail.
            // I will assume `avatar` field should be just the URL string for safety, or I should fix the Schema to match Object if that's the intention.
            // Given "Clean Code" requirement, I'll standardize on `avatar` as a String URL for now, unless I see Cloudinary strict requirement for public_id storage in DB (good for deletion).
            // Let's stick to what the controller was _trying_ to do but fix it to match Schema or update Schema.
            // Since I can't easily see DB data, I will update Schema to be robust or start simple.
            // userSchema Line 9: `avatar: {type:String ...}`
            // So controller sending an Object would fail or implicit cast.
            // I will save just the path (URL) to `avatar`.
        }

        // Merging social links needs the current user state if we want partial updates to that object
        // For now, I'll use dot notation to update specific fields if possible, or just update what's passed.

        // Let's simplify and fix the bug: 
        // If we want to support partial update of social links without fetching generic user:
        // We can use $set with flatten keys like "socialLinks.facebook".
        // But `authService` typically deals with Objects.

        // I will fetch the user to be safe and do a proper merge in memory, then save. 
        // It's cleaner logic than dynamic $set keys construction for now.
        const userToUpdate = await User.findById(userId);
        if (!userToUpdate) throw new Error("User not found");

        if (username) userToUpdate.username = username;
        if (email) userToUpdate.email = email;
        if (bio !== undefined) userToUpdate.bio = bio;
        if (password) userToUpdate.password = await bcrypt.hash(password, 10);

        if (file && file.path) {
            userToUpdate.avatar = file.path;
            // If we want to store public_id, we should update the schema.
            // For now, I'll assume string URL is enough as per current schema.
        }

        if (facebook || linkedin || whatsapp) {
            userToUpdate.socialLinks = {
                facebook: facebook || userToUpdate.socialLinks?.facebook,
                linkedin: linkedin || userToUpdate.socialLinks?.linkedin,
                whatsapp: whatsapp || userToUpdate.socialLinks?.whatsapp
            };
        }

        await userToUpdate.save();
        return userToUpdate.toObject();
    }
}

export default new AuthService();
