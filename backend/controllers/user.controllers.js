import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";

const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000
};

export const registerUser = async (req, res) => {
    try {
        const { name, username, email, password } = req.body;

        if (!username || !name || !password || !email) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }

        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(409).json({ message: "Username already exists" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const emailExists = await User.findOne({ email: normalizedEmail });
        if (emailExists) {
            return res.status(409).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username,
            name,
            password: hashedPassword,
            email: normalizedEmail
        });

        const token = generateToken(newUser._id);
        res.cookie("token", token, cookieOptions);

        return res.status(201).json({
            message: "Registration successful",
            user: {
                _id: newUser._id,
                name: newUser.name,
                username: newUser.username,
                email: newUser.email
            }
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal Server Error",
            error: err.message
        });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = generateToken(user._id);
        res.cookie("token", token, cookieOptions);

        return res.status(200).json({
            message: "Login successful",
            user: {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const logoutUser = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: "lax",
        secure: false
    });

    return res.status(200).json({ message: "Logged out successfully" });
};

export const getMe = async (req, res) => {
    return res.status(200).json(req.user);
};

export const getUserProfile = async (req, res) => {
    try {
        const { username } = req.params;

        const userData = await User.findOne({ username })
            .select("-password")
            // tom - 456
            .populate("followers", "name username profileImage")
            .populate("followings", "name username profileImage");

        if (!userData) {
            return res.status(404).json({ message: "User Not Found" });
        }

        return res.status(200).json({
            message: "User found",
            userData
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const followUser = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const targetUserId = req.params.id;

        if (currentUserId.toString() === targetUserId.toString()) {
            return res.status(409).json({ message: "You cannot follow yourself" });
        }

        const targetUser = await User.findById(targetUserId);

        if (!targetUser) {
            return res.status(404).json({ message: "No Target User Found" });
        }

        const alreadyFollowing = targetUser.followers.some(
            (id) => id.toString() === currentUserId.toString()
        );

        if (alreadyFollowing) {
            return res.status(409).json({ message: "You are already following this user" });
        }

        await User.findByIdAndUpdate(currentUserId, {
            $addToSet: { followings: targetUserId }
        });

        await User.findByIdAndUpdate(targetUserId, {
            $addToSet: { followers: currentUserId }
        });

        return res.status(200).json({ message: "User followed" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const unfollowUser = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const targetUserId = req.params.id;

        if (currentUserId.toString() === targetUserId.toString()) {
            return res.status(409).json({ message: "You cannot unfollow yourself" });
        }

        const targetUser = await User.findById(targetUserId);

        if (!targetUser) {
            return res.status(404).json({ message: "No Target User Found" });
        }

        await User.findByIdAndUpdate(currentUserId, {
            $pull: { followings: targetUserId }
        });

        await User.findByIdAndUpdate(targetUserId, {
            $pull: { followers: currentUserId }
        });

        return res.status(200).json({ message: "User unfollowed" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { name, username, email, bio } = req.body;

        if (!name?.trim() || !username?.trim() || !email?.trim()) {
            return res.status(400).json({ message: "Name, username and email are required" });
        }

        const cleanUsername = username.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (await User.findOne({ username: cleanUsername, _id: { $ne: userId } })) {
            return res.status(409).json({ message: "Username already exists" });
        }

        if (await User.findOne({ email: normalizedEmail, _id: { $ne: userId } })) {
            return res.status(409).json({ message: "Email already exists" });
        }

        const updates = {
            name: name.trim(),
            username: cleanUsername,
            email: normalizedEmail,
            bio: bio?.trim() || "",
            // profileImage : 'url'
        };

        if (req.file) {
            const uploadedImage = await uploadToCloudinary(req.file.buffer);
            updates.profileImage = uploadedImage.secure_url;
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updates, {
            new: true,
            runValidators: true
        }).select("-password");

        return res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
        next(error);
    }
};




// export const updateUser = async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(409).json({ message: "No File Uploaded" });
//         }
//        const result =  await uploadToCloudinary(req.file.buffer)

//        res.send(result)


//     } catch (error) {
//         return res.status(500).json({ message: "Internal Server Error" });
//     }
// };



