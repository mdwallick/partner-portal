const crypto = require("crypto")

// Function to decrypt Auth0 session cookie
function decryptSessionCookie(encryptedCookie, secret) {
  // Try multiple decryption methods
  const methods = [
    () => decryptJWE(encryptedCookie, secret),
    () => decryptSimple(encryptedCookie, secret),
    () => decryptLegacy(encryptedCookie, secret),
  ]

  for (let i = 0; i < methods.length; i++) {
    try {
      const result = methods[i]()
      if (result) {
        console.log(`✅ Successfully decrypted using method ${i + 1}`)
        return result
      }
    } catch (error) {
      console.log(`❌ Method ${i + 1} failed:`, error.message)
    }
  }

  return null
}

// Method 1: JWE (JSON Web Encryption) format
function decryptJWE(encryptedCookie, secret) {
  const parts = encryptedCookie.split(".")
  if (parts.length !== 5) {
    throw new Error("Invalid JWE format")
  }

  const [header, encryptedKey, iv, ciphertext, tag] = parts

  // Decode base64url parts
  const headerObj = JSON.parse(Buffer.from(header, "base64url").toString())
  const encryptedKeyBuffer = Buffer.from(encryptedKey, "base64url")
  const ivBuffer = Buffer.from(iv, "base64url")
  const ciphertextBuffer = Buffer.from(ciphertext, "base64url")
  const tagBuffer = Buffer.from(tag, "base64url")

  // Derive key from secret
  const key = crypto.pbkdf2Sync(secret, "auth0", 100000, 32, "sha256")

  // Decrypt the key using createDecipheriv
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, ivBuffer)
  decipher.setAAD(Buffer.from(header, "base64url"))
  decipher.setAuthTag(tagBuffer)

  let decryptedKey = decipher.update(encryptedKeyBuffer)
  decryptedKey = Buffer.concat([decryptedKey, decipher.final()])

  // Decrypt the content using createDecipheriv
  const contentDecipher = crypto.createDecipheriv("aes-256-gcm", decryptedKey, ivBuffer)
  contentDecipher.setAAD(Buffer.from(header, "base64url"))
  contentDecipher.setAuthTag(tagBuffer)

  let decrypted = contentDecipher.update(ciphertextBuffer)
  decrypted = Buffer.concat([decrypted, contentDecipher.final()])

  return JSON.parse(decrypted.toString())
}

// Method 2: Simple AES-256-GCM with direct key derivation
function decryptSimple(encryptedCookie, secret) {
  const parts = encryptedCookie.split(".")
  if (parts.length !== 5) {
    throw new Error("Invalid format for simple decryption")
  }

  const [header, encryptedKey, iv, ciphertext, tag] = parts

  const encryptedKeyBuffer = Buffer.from(encryptedKey, "base64url")
  const ivBuffer = Buffer.from(iv, "base64url")
  const ciphertextBuffer = Buffer.from(ciphertext, "base64url")
  const tagBuffer = Buffer.from(tag, "base64url")

  // Try different key derivation methods
  const keyMethods = [
    () => crypto.pbkdf2Sync(secret, "auth0", 100000, 32, "sha256"),
    () => crypto.pbkdf2Sync(secret, "", 100000, 32, "sha256"),
    () => crypto.scryptSync(secret, "auth0", 32),
    () => crypto.scryptSync(secret, "", 32),
    () => Buffer.from(secret.padEnd(32, "0").substring(0, 32), "utf8"),
  ]

  for (const keyMethod of keyMethods) {
    try {
      const key = keyMethod()
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, ivBuffer)
      decipher.setAAD(Buffer.from(header, "base64url"))
      decipher.setAuthTag(tagBuffer)

      let decrypted = decipher.update(encryptedKeyBuffer)
      decrypted = Buffer.concat([decrypted, decipher.final()])

      const contentDecipher = crypto.createDecipheriv("aes-256-gcm", decrypted, ivBuffer)
      contentDecipher.setAAD(Buffer.from(header, "base64url"))
      contentDecipher.setAuthTag(tagBuffer)

      let content = contentDecipher.update(ciphertextBuffer)
      content = Buffer.concat([content, contentDecipher.final()])

      return JSON.parse(content.toString())
    } catch (error) {
      // Continue to next key method
    }
  }

  throw new Error("All key derivation methods failed")
}

// Method 3: Legacy format (base64 encoded JSON)
function decryptLegacy(encryptedCookie, secret) {
  try {
    // Try to decode as simple base64
    const decoded = Buffer.from(encryptedCookie, "base64").toString()
    const parsed = JSON.parse(decoded)

    // Check if it looks like a session object
    if (parsed.accessToken || parsed.idToken || parsed.user) {
      return parsed
    }
  } catch (error) {
    // Not a simple base64 JSON
  }

  throw new Error("Not a legacy format")
}

// Usage example
function main() {
  // Get the encrypted cookie and secret from command line arguments
  const encryptedCookie = process.argv[2]
  const customSecret = process.argv[3] // Optional custom secret

  if (!encryptedCookie) {
    console.log("Usage: node decrypt-session.js <encrypted-cookie> [custom-secret]")
    console.log("")
    console.log("Examples:")
    console.log('  node decrypt-session.js "cookie-value"')
    console.log('  node decrypt-session.js "cookie-value" "my-custom-secret"')
    console.log('  AUTH0_SECRET=my-secret node decrypt-session.js "cookie-value"')
    console.log("")
    console.log("To get the encrypted cookie:")
    console.log("1. Open Chrome DevTools (F12)")
    console.log("2. Go to Application tab > Cookies > http://localhost:3000")
    console.log('3. Copy the value of the "appSession" cookie')
    console.log('4. Run: node decrypt-session.js "paste-cookie-value-here"')
    return
  }

  // Use custom secret if provided, otherwise use environment variable or default
  const secret = customSecret || process.env.AUTH0_SECRET || "dev-secret-key-for-cookie-encryption"

  console.log("🔐 Decrypting Auth0 session cookie...")
  console.log("Secret used:", secret)
  console.log("Cookie length:", encryptedCookie.length)
  console.log("Cookie format check:")

  // Analyze the cookie format
  const parts = encryptedCookie.split(".")
  console.log(`  - Parts: ${parts.length}`)
  console.log(`  - First part (header): ${parts[0]?.substring(0, 20)}...`)
  console.log("")
  console.log("Secret used:", secret)
  console.log("")

  const session = decryptSessionCookie(encryptedCookie, secret)

  if (session) {
    console.log("✅ Session decrypted successfully!")
    console.log("")
    console.log("📋 Session Data:")
    console.log(JSON.stringify(session, null, 2))

    if (session.accessToken) {
      console.log("")
      console.log("🔑 Access Token (first 50 chars):", session.accessToken.substring(0, 50) + "...")
      console.log("🔑 ID Token (first 50 chars):", session.idToken?.substring(0, 50) + "...")
      console.log(
        "🔑 Refresh Token (first 50 chars):",
        session.refreshToken?.substring(0, 50) + "..."
      )
    }
  } else {
    console.log("❌ Failed to decrypt session")
    console.log("")
    console.log("Possible issues:")
    console.log("1. Wrong secret - check your AUTH0_SECRET environment variable")
    console.log("2. Invalid cookie format")
    console.log("3. Cookie is corrupted")
  }
}

main()
