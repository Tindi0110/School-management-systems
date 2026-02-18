$path = "frontend\src\pages\Students.tsx"
$content = Get-Content $path -Raw

# fix: navigate(`/student/${response.data.id}`) -> navigate(`/students/${response.data.id}`)
$content = $content.Replace("navigate(`/student/`", "navigate(`/students/`")

    # Also try double quotes just in case
    $content = $content.Replace('navigate("/student/"', 'navigate("/students/"')

    # Or without backticks if my previous read was weird
    # But replace is safe if string not found.

    # More robust regex?
    # navigate\(`\/student\/
    $content = [regex]::Replace($content, "navigate\(`\/student\/", "navigate(`/students/")

    Set-Content $path $content -NoNewline
    Write-Host "Fixed redirect URL."
