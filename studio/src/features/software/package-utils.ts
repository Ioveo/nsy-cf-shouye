/**
 * 安装包文件名智能解析器
 * 从文件名自动提取版本号、推断目标操作系统平台、架构及中文标识
 */

export interface ParsedPackageInfo {
  version: string | null
  platform: 'windows' | 'portable' | 'macos' | 'linux' | 'android' | 'other'
  arch: 'x64' | 'arm64' | 'x86'
  ext: string
  label: string
}

export function parsePackageFileName(fileName: string): ParsedPackageInfo {
  const cleanName = String(fileName || '').trim()
  const ext = (cleanName.split('.').pop() || '').toLowerCase()
  const lower = cleanName.toLowerCase()

  // 1. 提取版本号 (如从 "天才猫桌面1.8.19.zip" 提取 "1.8.19", "v2.0.0-beta.1" 等)
  // 匹配形如 1.8.19, v1.8.19, ver1.8.19, version1.8.19, 1.8.19-beta
  const verMatch = cleanName.match(/(?:v|ver|version)?\s*([0-9]+\.[0-9]+(?:\.[0-9]+)*(?:-[a-zA-Z0-9.]+)?)/i)
  const version = verMatch ? verMatch[1] : null

  // 2. 推断所属平台与包形态
  let platform: ParsedPackageInfo['platform'] = 'windows'
  if (ext === 'dmg' || ext === 'pkg' || /mac|osx|darwin/i.test(lower)) {
    platform = 'macos'
  } else if (ext === 'apk') {
    platform = 'android'
  } else if (ext === 'deb' || ext === 'rpm' || ext === 'appimage' || lower.endsWith('.tar.gz')) {
    platform = 'linux'
  } else if (ext === 'zip' || ext === '7z' || ext === 'rar' || /portable|绿色|便携|免安装/i.test(lower)) {
    platform = 'portable'
  } else if (ext === 'exe' || ext === 'msi') {
    platform = 'windows'
  } else {
    platform = 'other'
  }

  // 3. 推断架构
  let arch: ParsedPackageInfo['arch'] = 'x64'
  if (/arm64|aarch64|m1|m2|m3/i.test(lower)) {
    arch = 'arm64'
  } else if (/x86|win32|ia32|32bit/i.test(lower)) {
    arch = 'x86'
  }

  // 4. 推荐中文名称
  let label = '官方安装包'
  if (platform === 'portable') label = '绿色便携版'
  else if (platform === 'windows') label = 'Windows 安装版'
  else if (platform === 'macos') label = 'macOS 通用包'
  else if (platform === 'linux') label = 'Linux 安装包'
  else if (platform === 'android') label = 'Android 版'

  return { version, platform, arch, ext, label }
}
