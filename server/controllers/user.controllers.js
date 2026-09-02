import User from "../models/user.model.js"

// Register Controller

export const resgiterUser = async (req, res) => {
    try {
        const { name, email, password, username } = req.body
        // all fileds present 
        // if the email or username already exists
        // password should be greater tha 6 characters

        if (!username || !email || !password || !name) {
            return res.status(400).json({ message: "All fields Required" })
        }


        if (password.length < 6) {
            return res.status(400).json({ message: "Password Length should be greater than 6" })
        }

        const userNameExists = await User.findOne({ username })

        if (userNameExists) {
            return res.status(409).json({ message: "User Already Exists" })
        }

        const emailExists = await User.findOne({ email })

        if (emailExists) {
            return res.status(409).json({ message: "User Already Exists" })
        }


        const newUser = await User.create({
            name,
            username,
            email,
            password
        })

        res.status(201).json({ message: "User Resgitered", user: newUser })

} catch (error) {
        res.status(500).json({ message: 'Internal Server Errorr', error: error })
    }
}