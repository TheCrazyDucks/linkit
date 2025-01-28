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

## Servers
All the servers are located within `backend/`

### Node.js
deploy the JS server locally:

```
cd backend/server
docker compose up --build
```

### Rust

### Go

## Plugins
### _wordpress_

The wordpress plugin is written in php.
Install it via WordPress's admin dashboard - using the compressed linkit folder.

You can run a test server on port `1234` using the compose file at `plugins/wordpress/` folder
```
cd plugins/wordpress/
docker compose up 
```
