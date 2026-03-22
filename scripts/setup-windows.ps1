#Requires -Version 5.1
# setup for windows
# installs java 17, maven, node 20, postgres 16 via chocolatey
# run in powershell as admin: .\setup-windows.ps1

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$NODE_VERSION = "20"
$JAVA_VERSION = "17"

function ok($msg)   { Write-Host "  + $msg" -ForegroundColor Green }
function info($msg) { Write-Host "  $msg" }
function warn($msg) { Write-Host "  ! $msg" -ForegroundColor Yellow }
function fail($msg) { Write-Host "  x $msg" -ForegroundColor Red }

function has($cmd) {
    $null = Get-Command $cmd -ErrorAction SilentlyContinue
    return $?
}

function Refresh-Path {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
}

# check admin
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    fail "need to run this as administrator"
    info "right-click powershell -> run as administrator"
    exit 1
}

Write-Host "setting up Byte Me dev environment on Windows"
Write-Host ""

# chocolatey
Write-Host "--- chocolatey ---"
if (-not (has "choco")) {
    info "installing chocolatey..."
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    Refresh-Path
    ok "chocolatey installed"
} else {
    ok "chocolatey already installed"
}

# git
Write-Host ""
Write-Host "--- git ---"
if (-not (has "git")) {
    choco install git -y --no-progress
    Refresh-Path
    ok "git installed"
} else {
    ok "$(git --version)"
}

# node
Write-Host ""
Write-Host "--- node.js ---"
if (-not (has "node")) {
    info "installing node.js lts..."
    choco install nodejs-lts -y --no-progress
    Refresh-Path
    ok "node installed"
} else {
    ok "node $(node --version)"
}

if (-not (has "npm")) {
    fail "npm not found, something went wrong with node"
    exit 1
}
ok "npm $(npm --version)"

# java
Write-Host ""
Write-Host "--- java $JAVA_VERSION ---"
$javaOk = $false
try {
    $jv = java -version 2>&1 | Select-String "version"
    if ($jv) {
        $javaOk = $true
        ok "java already installed: $jv"
    }
} catch {}

if (-not $javaOk) {
    info "installing openjdk $JAVA_VERSION..."
    choco install openjdk$JAVA_VERSION -y --no-progress
    Refresh-Path

    $javaPath = (Get-ChildItem "C:\Program Files\OpenJDK\*" -Directory | Sort-Object Name -Descending | Select-Object -First 1).FullName
    if ($javaPath) {
        [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $javaPath, "Machine")
        $env:JAVA_HOME = $javaPath
        ok "JAVA_HOME = $javaPath"
    }
    ok "java installed"
}

# maven
Write-Host ""
Write-Host "--- maven ---"
if (-not (has "mvn")) {
    choco install maven -y --no-progress
    Refresh-Path
    ok "maven installed"
} else {
    ok "$(mvn --version | Select-Object -First 1)"
}

# postgres
Write-Host ""
Write-Host "--- postgresql ---"
if (-not (has "psql")) {
    info "installing postgresql..."
    choco install postgresql16 -y --no-progress --params '/Password:postgres'
    Refresh-Path
    ok "postgresql installed (default password: postgres)"
} else {
    ok "$(psql --version)"
}

# summary
Write-Host ""
Write-Host "-----------------------------"
Write-Host "everything should be installed now"
Write-Host ""
Write-Host "  git:      $(if (has 'git') { git --version } else { 'missing' })"
Write-Host "  node:     $(if (has 'node') { node --version } else { 'missing' })"
Write-Host "  npm:      $(if (has 'npm') { npm --version } else { 'missing' })"
Write-Host "  java:     $(if (has 'java') { 'installed' } else { 'missing' })"
Write-Host "  maven:    $(if (has 'mvn') { 'installed' } else { 'missing' })"
Write-Host "  postgres: $(if (has 'psql') { psql --version } else { 'missing' })"
Write-Host ""
Write-Host "next steps:"
Write-Host "  1. close and reopen your terminal"
Write-Host "  2. create the database: psql -U postgres -c 'CREATE DATABASE byte_me;'"
Write-Host "  3. copy .env.example to backend/.env and fill in your values"
Write-Host "  4. start backend:  cd backend; mvn spring-boot:run"
Write-Host "  5. start frontend: cd frontend; npm install; npm run dev"
