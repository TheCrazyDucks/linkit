# LinkiT

```
 __        ________  ___   __    ___   ___   ________  _________  
/_/\      /_______/\/__/\ /__/\ /___/\/__/\ /_______/\/________/\ 
\:\ \     \__.::._\/\::\_\\  \ \\::.\ \\ \ \\__.::._\/\__.::.__\/ 
 \:\ \       \::\ \  \:. `-\  \ \\:: \/_) \ \  \::\ \    \::\ \   
  \:\ \____  _\::\ \__\:. _    \ \\:. __  ( (  _\::\ \__  \::\ \  
   \:\/___/\/__\::\__/\\. \`-\  \ \\: \ )  \ \/__\::\__/\  \::\ \ 
    \_____\/\________\/ \__\/ \__\/ \__\/\__\/\________\/   \__\/ 

```

## Server

deploy the server locally:
```
docker compose up --build
```

## Plugins
### wordpress

The wordpress plugin is written in php.
Install it via WordPress admin dashboard - using the compressed linkit folder.

You can run a test server using the compose file at `/wordpress` folder
```
cd wordpress
docker compose up 
```
