import bcrypt from "npm:bcryptjs@2.4.3";
async function main() {
  try {
    const valid = await bcrypt.compare("@Adm7881", "@Adm7881");
    console.log("VALID: " + valid);
  } catch (e) {
    console.log("ERROR: " + e.message);
  }
}
main();
