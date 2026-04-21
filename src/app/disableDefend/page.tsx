import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Disable Windows Defender (registry notes) | Aden Tranter",
  description: "Raw PowerShell reference for disabling Windows Defender via registry.",
  robots: { index: false, follow: false },
}

const setDefenderPolicyLine =
  'Set-ItemProperty -Path "HKLM:' +
  String.raw`\SOFTWARE\Policies\Microsoft\Windows Defender` +
  '" `'

const rtPathAssignmentLine =
  '$rtPath = "HKLM:' +
  String.raw`\SOFTWARE\Policies\Microsoft\Windows Defender\Real-Time Protection` +
  '"'

const RAW_LINES = [
  "# Disable Windows Defender via Registry",
  "# Run as Administrator",
  "",
  "Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force",
  "",
  "# Check Tamper Protection state and warn if enabled",
  "$tamperStatus = (Get-MpComputerStatus).IsTamperProtected",
  "If ($tamperStatus) {",
  '    Write-Host "---------------------------------------------------" -ForegroundColor Red',
  '    Write-Host "TAMPER PROTECTION IS ON - Script may not fully work" -ForegroundColor Red',
  '    Write-Host "Disable it first via:" -ForegroundColor Red',
  '    Write-Host "  Windows Security > Virus & threat protection >" -ForegroundColor Red',
  '    Write-Host "  Manage settings > Tamper Protection > Off" -ForegroundColor Red',
  '    Write-Host "---------------------------------------------------" -ForegroundColor Red',
  '    $confirm = Read-Host "Continue anyway? (y/n)"',
  "    If ($confirm -ne \"y\") { Exit }",
  "}",
  "",
  'Write-Host "Disabling Windows Defender..." -ForegroundColor Yellow',
  "",
  "# Disable Real-Time Protection via Windows Defender service",
  "Set-MpPreference -DisableRealtimeMonitoring $true",
  "",
  "# Disable via Registry - top level",
  setDefenderPolicyLine,
  '    -Name "DisableAntiSpyware" -Value 1 -Type DWord -Force',
  "",
  "# Disable Real-Time Protection via Registry",
  rtPathAssignmentLine,
  "If (!(Test-Path $rtPath)) { New-Item -Path $rtPath -Force | Out-Null }",
  "",
  'Set-ItemProperty -Path $rtPath -Name "DisableRealtimeMonitoring"    -Value 1 -Type DWord -Force',
  'Set-ItemProperty -Path $rtPath -Name "DisableBehaviorMonitoring"    -Value 1 -Type DWord -Force',
  'Set-ItemProperty -Path $rtPath -Name "DisableOnAccessProtection"    -Value 1 -Type DWord -Force',
  'Set-ItemProperty -Path $rtPath -Name "DisableScanOnRealtimeEnable"  -Value 1 -Type DWord -Force',
  "",
  'Write-Host "Done. Reboot required for changes to take effect." -ForegroundColor Green',
]

const RAW_TEXT = RAW_LINES.join("\n")

export default function DisableDefendPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <h1 className="mb-2 text-lg font-medium text-white">/disableDefend</h1>
      <p className="mb-6 text-sm text-white/60">
        Raw text for reference. Use only on systems you own and are permitted to change.
      </p>
      <pre className="overflow-x-auto rounded-lg border border-white/10 bg-slate-950/60 p-4 font-mono text-xs leading-relaxed text-white/90 sm:text-sm">
        <code>{RAW_TEXT}</code>
      </pre>
    </div>
  )
}
