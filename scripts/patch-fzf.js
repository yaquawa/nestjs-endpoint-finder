/**
 * FZF Package Patcher
 *
 * This script automatically removes "type": "module" from fzf package.json
 * to enable CommonJS compatibility in VSCode extensions.
 *
 * Runs automatically after npm install via postinstall hook.
 */

const fs = require('fs')
const path = require('path')

function patchFzfPackage() {
  const fzfPackageJsonPath = path.join(__dirname, '../node_modules/fzf/package.json')

  console.log('🔧 Checking fzf package for CommonJS compatibility...')

  // Check if fzf package exists
  if (!fs.existsSync(fzfPackageJsonPath)) {
    console.log('⚠️  fzf package not found - skipping patch')
    return
  }

  try {
    // Read current package.json
    const packageJsonContent = fs.readFileSync(fzfPackageJsonPath, 'utf8')
    const packageJson = JSON.parse(packageJsonContent)

    // Check if patch is needed
    if (packageJson.type !== 'module') {
      console.log('✅ fzf package already CommonJS compatible - no patch needed')
      return
    }

    // Create backup
    const backupPath = fzfPackageJsonPath + '.backup'
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, packageJsonContent)
      console.log('💾 Created backup: package.json.backup')
    }

    // Remove "type": "module"
    delete packageJson.type

    // Write patched version
    const patchedContent = JSON.stringify(packageJson, null, 2)
    fs.writeFileSync(fzfPackageJsonPath, patchedContent)

    console.log('✅ Successfully patched fzf package.json - removed "type": "module"')
    console.log('🎯 fzf is now CommonJS compatible for VSCode extensions')
  } catch (error) {
    console.error('❌ Error patching fzf package:', error.message)
    process.exit(1)
  }
}

// Run the patch
patchFzfPackage()
