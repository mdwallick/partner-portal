const fs = require("fs")
const path = require("path")

// Read the updated FGA model
const modelPath = path.join(__dirname, "..", "fga-model.dsl")
const modelContent = fs.readFileSync(modelPath, "utf8")

console.log("Updated FGA Model:")
console.log(modelContent)

console.log("\nTo update the FGA authorization model, you need to:")
console.log("1. Go to your FGA dashboard")
console.log("2. Navigate to your store")
console.log('3. Go to "Authorization Models"')
console.log("4. Create a new version with the updated model above")
console.log("5. Update the FGA_AUTHORIZATION_MODEL_ID in your .env file")

console.log("\nOr use the FGA CLI:")
console.log("fga model write --store-id=YOUR_STORE_ID --file=fga-model.dsl")
