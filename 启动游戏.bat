@echo off
chcp 65001 >nul
title 钢铁防线 - Tank Arena
cd /d "%~dp0"
echo ============================================
echo   🎖️ 钢铁防线 - Tank Arena
echo ============================================
echo.
echo   正在启动游戏...
start "" "index.html"
echo   游戏已在浏览器中启动！
echo.
echo   操作说明：
echo   P1(红): WASD移动 / H键发射
echo   P2(蓝): 方向键移动 / 数字5发射
echo   P3(绿): 鼠标控制 / 左键发射
echo.
timeout /t 3 >nul
exit
