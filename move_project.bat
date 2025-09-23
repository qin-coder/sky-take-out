@echo off
cd /d D:\SkytakeoutCode\sky-take-out

echo === 创建新目录 sky-take-out-springboot ===
mkdir sky-take-out-springboot

echo === 移动文件和文件夹到 sky-take-out-springboot/ ===
git mv sky-common sky-take-out-springboot/
git mv sky-pojo sky-take-out-springboot/
git mv sky-server sky-take-out-springboot/
git mv .gitignore sky-take-out-springboot/
git mv pom.xml sky-take-out-springboot/

echo === 提交改动 ===
git commit -m "Restructure: move all modules into sky-take-out-springboot/"

echo === 推送到远程 master 分支 ===
git push origin master

echo.
echo ✅ 项目结构已调整并推送到远程 master！
pause
