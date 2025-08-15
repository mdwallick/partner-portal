const { getAvailableConnections } = require("../lib/auth0-management.ts")

async function checkConnections() {
  try {
    console.log("Checking available Auth0 connections...")
    const connections = await getAvailableConnections()

    console.log("\nAvailable connections:")
    connections.forEach(conn => {
      console.log(`- Name: ${conn.name}, Strategy: ${conn.strategy}, Enabled: ${conn.enabled}`)
    })

    // Look for email/passwordless connections
    const emailConnections = connections.filter(
      conn =>
        conn.strategy === "email" ||
        conn.name.toLowerCase().includes("email") ||
        conn.name.toLowerCase().includes("passwordless")
    )

    if (emailConnections.length > 0) {
      console.log("\nEmail/Passwordless connections found:")
      emailConnections.forEach(conn => {
        console.log(`- Name: ${conn.name}, Strategy: ${conn.strategy}, Enabled: ${conn.enabled}`)
      })
    } else {
      console.log("\nNo email/passwordless connections found.")
    }
  } catch (error) {
    console.error("Error checking connections:", error)
  }
}

checkConnections()
