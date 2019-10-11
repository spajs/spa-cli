Command Line Interface (CLI) to support [Single Page Application(js)](https://spa.js.org) framework.

# INSTALL
> npm install -g spa-cli

---
#USAGE:
## Create a new app
> spa-cli appName

OR

> spa-cli appName --new

## Create a new component

NOTE: Use . instead of 'appName' if 'appName' directory is current working directory.

> spa-cli appName componentName

OR

> spa-cli appName componentName --new

OR

> spa-cli appName/componentName

OR

> spa-cli appName/componentName --new


## Create multiple components

NOTE: Use . instead of 'appName' if 'appName' directory is current working directory.

> spa-cli appName componentX,componentY

OR

> spa-cli appName componentX,componentY --new

OR

> spa-cli appName/componentX,componentY

OR

> spa-cli appName/componentX,componentY --new

## Backup app
> spa-cli appName --zip

## Update SPA JS Bundle
> spa-cli appName --update
---
## LiveServer Options
###Requires live-server (run install command as root/Administrator)
> npm install -g live-server


To start LiveServer for an app, use --start option at the end of spa-cli command.

Example:
> spa-cli appName --start

Along with --start option use --ch OR --chrome OR --ff OR --firefox OR --ie OR --iexplore to open respective browser.

Example:
> spa-cli appName --start --ch

> spa-cli appName --start --chrome

> spa-cli appName --start --ff

> spa-cli appName --start --firefox

> spa-cli appName --start --ie

> spa-cli appName --start --iexplore

---
# LINKS
[SPA JS (Web)](https://spa.js.org) | [SPA JS (GitHub)](https://github.com/sucom/SPA.js)