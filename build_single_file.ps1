$profileB64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\Users\YASH DHIMAN\.gemini\antigravity\scratch\rishu-trains\profile.png'))
$reel1B64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\Users\YASH DHIMAN\.gemini\antigravity\scratch\rishu-trains\reel1.jpg'))
$reel2B64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\Users\YASH DHIMAN\.gemini\antigravity\scratch\rishu-trains\reel2.jpg'))
$reel3B64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\Users\YASH DHIMAN\.gemini\antigravity\scratch\rishu-trains\reel3.png'))
$reel4B64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\Users\YASH DHIMAN\.gemini\antigravity\scratch\rishu-trains\reel4.png'))

$profileData = "data:image/png;base64,$profileB64"
$reel1Data = "data:image/jpeg;base64,$reel1B64"
$reel2Data = "data:image/jpeg;base64,$reel2B64"
$reel3Data = "data:image/png;base64,$reel3B64"
$reel4Data = "data:image/png;base64,$reel4B64"

$content = [IO.File]::ReadAllText('C:\Users\YASH DHIMAN\.gemini\antigravity\scratch\rishu-trains\full-pro-website.html')
$content = $content.Replace('profile.png', $profileData)
$content = $content.Replace('reel1.jpg', $reel1Data)
$content = $content.Replace('reel2.jpg', $reel2Data)
$content = $content.Replace('reel3.png', $reel3Data)
$content = $content.Replace('reel4.png', $reel4Data)

[IO.File]::WriteAllText('C:\Users\YASH DHIMAN\Desktop\index.html', $content)
[IO.File]::WriteAllText('C:\Users\YASH DHIMAN\.gemini\antigravity\scratch\rishu-trains\index.html', $content)
Write-Host "FINISHED_SUCCESSFULLY"
