const { OpenFgaApi } = require("@openfga/sdk")

const fga = new OpenFgaApi({
  apiUrl: process.env.FGA_API_URL || "https://api.us1.fga.dev",
  storeId: process.env.FGA_STORE_ID,
  authorizationModelId: process.env.FGA_AUTHORIZATION_MODEL_ID,
})

async function testFgaModel() {
  try {
    console.log("🔍 Testing FGA model...")

    // Get the current authorization model
    const { data: model } = await fga.readAuthorizationModel()
    console.log("✅ Current FGA model:", model.authorization_model.id)

    // List all type definitions
    console.log("\n📋 Type definitions:")
    model.authorization_model.type_definitions.forEach(typeDef => {
      console.log(`\nType: ${typeDef.type}`)
      console.log("Relations:")
      typeDef.relations.forEach(relation => {
        console.log(`  - ${relation.name}: ${relation.rewrite}`)
      })
      console.log("Permissions:")
      typeDef.metadata?.relations?.forEach(permission => {
        console.log(`  - ${permission.name}: ${permission.relation}`)
      })
    })

    // Test ListObjects with different relations
    console.log("\n🧪 Testing ListObjects...")

    const testUser = "user:google-oauth2|103437188793489113148"

    // Test with 'view' permission
    try {
      const viewResult = await fga.listObjects({
        user: testUser,
        relation: "view",
        type: "partner",
      })
      console.log('✅ ListObjects with "view" permission:', viewResult.data.objects)
    } catch (error) {
      console.log('❌ ListObjects with "view" permission failed:', error.message)
    }

    // Test with 'can_view' relation
    try {
      const canViewResult = await fga.listObjects({
        user: testUser,
        relation: "can_view",
        type: "partner",
      })
      console.log('✅ ListObjects with "can_view" relation:', canViewResult.data.objects)
    } catch (error) {
      console.log('❌ ListObjects with "can_view" relation failed:', error.message)
    }

    // Test with 'cr_admin' relation
    try {
      const crAdminResult = await fga.listObjects({
        user: testUser,
        relation: "cr_admin",
        type: "partner",
      })
      console.log('✅ ListObjects with "cr_admin" relation:', crAdminResult.data.objects)
    } catch (error) {
      console.log('❌ ListObjects with "cr_admin" relation failed:', error.message)
    }
  } catch (error) {
    console.error("❌ Error testing FGA model:", error)
  }
}

testFgaModel()
