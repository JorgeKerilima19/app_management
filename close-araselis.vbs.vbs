' close-araselis.vbs
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d C:\Users\USER\Desktop\app && pm2 stop araselis-web", 0, True