const { checkFgaPermission } = require("../lib/fga.ts")

async function testUserPermissions() {
  const userId = "email|687db976c6ecee58714033b3" // nico1@nicopowered.com
  const partnerId = "d87b44a4-f024-4dae-9ebd-be4c89857f7e"

  console.log(`Testing permissions for user: ${userId}`)
  console.log(`Partner ID: ${partnerId}`)
  console.log("---")

  // Test 1: Can view their assigned partner
  try {
    const canViewPartner = await checkFgaPermission(userId, "view", `partner:${partnerId}`)
    console.log(`✅ Can view partner ${partnerId}: ${canViewPartner}`)
  } catch (error) {
    console.log(`❌ Error checking partner view: ${error.message}`)
  }

  // Test 2: Can manage their assigned partner (should be false)
  try {
    const canManagePartner = await checkFgaPermission(userId, "manage", `partner:${partnerId}`)
    console.log(`✅ Can manage partner ${partnerId}: ${canManagePartner}`)
  } catch (error) {
    console.log(`❌ Error checking partner manage: ${error.message}`)
  }

  // Test 3: Can view a different partner (should be false)
  try {
    const canViewOtherPartner = await checkFgaPermission(
      userId,
      "view",
      "partner:different-partner-id"
    )
    console.log(`✅ Can view other partner: ${canViewOtherPartner}`)
  } catch (error) {
    console.log(`❌ Error checking other partner view: ${error.message}`)
  }

  // Test 4: Can view platform data (should be false)
  try {
    const canViewPlatform = await checkFgaPermission(userId, "view_all", "platform:main")
    console.log(`✅ Can view platform: ${canViewPlatform}`)
  } catch (error) {
    console.log(`❌ Error checking platform view: ${error.message}`)
  }

  console.log("---")
  console.log("Expected results:")
  console.log("- Can view assigned partner: true")
  console.log("- Can manage assigned partner: false")
  console.log("- Can view other partner: false")
  console.log("- Can view platform: false")
}

testUserPermissions().catch(console.error)
