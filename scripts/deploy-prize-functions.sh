#!/bin/bash
# 在部署前为奖品相关云函数安装依赖（本地安装后打包上传，避免云端安装失败）
cd "$(dirname "$0")/.."
CLOUDFUNCTIONS="cloudfunctions"

for dir in list-prizes redeem-prize admin-list-prizes admin-create-prize admin-update-prize admin-delete-prize; do
  if [ -d "$CLOUDFUNCTIONS/$dir" ]; then
    echo "Installing dependencies for $dir..."
    (cd "$CLOUDFUNCTIONS/$dir" && npm install --production)
    echo "Done: $dir"
  fi
done

echo ""
echo "All dependencies installed. Now run: tcb fn deploy list-prizes (and others)"
