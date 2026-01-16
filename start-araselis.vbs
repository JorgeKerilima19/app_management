' start-araselis.vbs
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d C:\Users\USER\Desktop\app && pm2 start ecosystem.config.js", 0, False