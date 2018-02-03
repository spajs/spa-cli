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
> spa-cli appName componentName

OR

> spa-cli appName componentName --new

OR

> spa-cli appName/componentName

OR

> spa-cli appName/componentName --new


## Create multiple components
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
Start LiveServer for an app using --start option at the end
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