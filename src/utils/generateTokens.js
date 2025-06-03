import jwt from 'jsonwebtoken'

export const generateToken = (res, user, message, tokenExpiry = 24 * 60 * 60 * 1000) => {
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: tokenExpiry / 1000 // Convert from milliseconds to seconds
    })
    
    return res
        .status(200)
        .cookie("token", token, {
            httpOnly: true,
            secure: true, // Always true for devtunnels and production (HTTPS)
            sameSite: 'none', // Required for cross-site cookies
            maxAge: tokenExpiry,
            path: '/'
        })
        .json({
            success: true,
            message,
            user
        })
}