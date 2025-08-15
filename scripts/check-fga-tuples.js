const { fgaClient } = require("../lib/fga.ts")

async function checkFgaTuples() {
  const userId = "email|687db976c6ecee58714033b3" // nico1@nicopowered.com
  const partnerId = "d87b44a4-f024-4dae-9ebd-be4c89857f7e"

  console.log(`Checking FGA tuples for user: ${userId}`)
  console.log(`Partner ID: ${partnerId}`)
  console.log("---")

  try {
    // Get the latest authorization model ID
    const {
      data: { authorization_models },
    } = await fgaClient.listAuthorizationModels()
    const latestModel = authorization_models[0]
    console.log(`Using FGA model: ${latestModel.id}`)

    // Check what tuples exist for this user
    const {
      data: { tuple_keys },
    } = await fgaClient.read({
      tuple_key: {
        user: `user:${userId}`,
        relation: "",
        object: "",
      },
    })

    console.log("\nFGA tuples for this user:")
    tuple_keys.forEach(tuple => {
      console.log(`- ${tuple.user} ${tuple.relation} ${tuple.object}`)
    })

    // Test specific permissions
    console.log("\nTesting specific permissions:")

    // Test 1: Can view their assigned partner
    const {
      data: { allowed },
    } = await fgaClient.check({
      tuple_key: {
        user: `user:${userId}`,
        relation: "view",
        object: `partner:${partnerId}`,
      },
    })
    console.log(`✅ Can view partner ${partnerId}: ${allowed}`)

    // Test 2: Can manage their assigned partner (should be false)
    const {
      data: { allowed: canManage },
    } = await fgaClient.check({
      tuple_key: {
        user: `user:${userId}`,
        relation: "manage",
        object: `partner:${partnerId}`,
      },
    })
    console.log(`✅ Can manage partner ${partnerId}: ${canManage}`)

    // Test 3: Can view a different partner (should be false)
    const {
      data: { allowed: canViewOther },
    } = await fgaClient.check({
      tuple_key: {
        user: `user:${userId}`,
        relation: "view",
        object: "partner:different-partner-id",
      },
    })
    console.log(`✅ Can view other partner: ${canViewOther}`)
  } catch (error) {
    console.error("Error checking FGA tuples:", error)
  }
}

checkFgaTuples().catch(console.error)
