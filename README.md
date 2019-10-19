Command Line Interface (CLI) to support [Single Page Application(js)](https://spa.js.org) framework.

# INSTALL
> npm install -g spa-cli

---
#USAGE:

## Create a new app
> spa-cli appName

OR use --new option to download and use the latest boilerplate bundle from SPA.js repository.

> spa-cli appName --new

---

## Create a new component

NOTE: Use . instead of 'appName' if 'appName' directory is current working directory.

> spa-cli appName componentName

OR

> spa-cli appName/componentName

OR use --new option to download and use the latest boilerplate bundle from SPA.js repository.

> spa-cli appName/componentName --new

> spa-cli appName componentName --new


## Create multiple components

NOTE: Use . instead of 'appName' if 'appName' directory is current working directory.

> spa-cli appName componentX,componentY

OR

> spa-cli appName/componentX,componentY

OR use --new option to download and use the latest boilerplate bundle from SPA.js repository.

> spa-cli appName componentX,componentY --new

> spa-cli appName/componentX,componentY --new

---

## To use your own boilerplate bundle for new app and components.

> spa-cli your-custom-app-bundle.zip --app

> spa-cli your-custom-component-bundle.zip --component

your-custom-component-bundle.zip must contain the following files with custom content:
- componentX.js
- componentX.html
- componentX.css (optional)

NOTE: The string 'componentX' will be replaced with actual componentName, including the file name and the content inside the files during a new component creation.

- [sample-app-bundle](https://spa.js.org/seed-bundle/spa-app-base.zip)
- [sample-component-bundle](https://spa.js.org/seed-bundle/spa-component-base.zip)

## Reset to default bundle
Reset bundles with the latest boilerplate bundle(s) from SPA.js repository.

> spa-cli --reset

> spa-cli --reset --app

> spa-cli --reset --component

---

## Backup app

> spa-cli appName --zip

---

## Update SPA JS Bundle with the latest version

> spa-cli appName --update

---

## LiveServer Options
###Requires live-server (run install command as root/Administrator)
> npm install -g live-server


To start LiveServer for an app, use --start option at the end of spa-cli command.

Example:
> spa-cli appName --start

Along with --start option, use --ch OR --chrome OR --ff OR --firefox OR --ie OR --iexplore to open respective browser.

Example:
> spa-cli appName --start --ch

> spa-cli appName --start --chrome

> spa-cli appName --start --ff

> spa-cli appName --start --firefox

> spa-cli appName --start --ie

> spa-cli appName --start --iexplore

---

## LINKS

[SPA JS (Web)](https://spa.js.org) | [SPA JS (GitHub)](https://github.com/sucom/SPA.js)
