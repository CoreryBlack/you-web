const jwt = require('jsonwebtoken')
const data = require('../data')

const SECRET_KEY = process.env.JWT_SECRET || 'you-uni-app-secret-key-2024'
const EXPIRES_IN = '24h'

function generateTokenForUser(userObj) {
  const payload = {
    id: userObj.staff_id || userObj.user_id,
    type: userObj.staff_id ? 'staff' : 'user'
  }
  
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: EXPIRES_IN })
  
  // Compatibility: store in memory object (optional)
  userObj.token = token
  
  return token
}

function verifyToken(token) {
  if (!token) return null
  
  try {
    const decoded = jwt.verify(token, SECRET_KEY)
    const { id, type } = decoded
    
    if (type === 'staff') {
      const staff = data.staff.find(s => s.staff_id === id)
      // Optional: Check if the token matches the latest one issued (Single Session / Revocation support)
      if (staff && staff.token === token) return { type: 'staff', user: staff }
    } else if (type === 'user') {
      const user = data.users.find(u => u.user_id === id)
      if (user && user.token === token) return { type: 'user', user }
    }
  } catch (err) {
    // expired or invalid
    return null
  }
  return null
}

function revokeToken(token) {
  // Stateless JWTs cannot be easily revoked without a blacklist. 
  // For now, we attempt to clear it if it matches the memory object.
  if(!token) return false
  
  // Decode without verifying to find the user to clear the token field from
  const decoded = jwt.decode(token)
  if (decoded && decoded.id) {
     if (decoded.type === 'staff') {
        const s = data.staff.find(x => x.staff_id === decoded.id)
        if (s) { s.token = null; return true; }
     }
     if (decoded.type === 'user') {
        const u = data.users.find(x => x.user_id === decoded.id)
        if (u) { u.token = null; return true; }
     }
  }
  return false
}

module.exports = { generateTokenForUser, verifyToken, revokeToken }
