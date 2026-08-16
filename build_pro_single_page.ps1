# Build Helper Script for @rishutrains website
$src = "C:\Users\YASH DHIMAN\.gemini\antigravity\scratch\rishu-trains\index.html"
$destDesktop = "C:\Users\YASH DHIMAN\Desktop\index.html"
$destFull = "C:\Users\YASH DHIMAN\.gemini\antigravity\scratch\rishu-trains\full-pro-website.html"

Copy-Item -Path $src -Destination $destDesktop -Force
Copy-Item -Path $src -Destination $destFull -Force
Write-Host "SUCCESS: Published updated index.html to Desktop and full-pro-website.html"
