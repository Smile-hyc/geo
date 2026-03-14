# 在部署前为奖品相关云函数安装依赖（本地安装后打包上传，避免云端安装失败）
$dirs = @(
  "list-prizes",
  "redeem-prize",
  "admin-list-prizes",
  "admin-create-prize",
  "admin-update-prize",
  "admin-delete-prize"
)

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$cloudfunctions = Join-Path $root "cloudfunctions"

foreach ($dir in $dirs) {
  $path = Join-Path $cloudfunctions $dir
  if (Test-Path $path) {
    Write-Host "Installing dependencies for $dir..."
    Push-Location $path
    npm install --production
    Pop-Location
    Write-Host "Done: $dir"
  }
}

Write-Host ""
Write-Host "All dependencies installed. Now run: tcb fn deploy list-prizes (and others)"
