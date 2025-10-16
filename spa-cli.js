#!/usr/bin/env node

const args            = require('minimist')(process.argv.slice(2));
const fs              = require('fs-extra');  // Use fs-extra instead of fs + file-exists
const path            = require('path');
const axios           = require('axios');     // Replace download
const archiver        = require('archiver');
const unzip           = require('extract-zip');
const moment          = require('moment');
const net             = require('net');

const appBaseBundle   = 'spa-app-base.zip';
const compBaseBundle  = 'spa-component-base.zip';

const argv            = args._;
const spaCliRootFldr  = __dirname;
const spaDownloadFldr = path.resolve(spaCliRootFldr, 'downloads');
const urlAppBundle    = 'https://spa.js.org/seed-bundle/'+appBaseBundle;
const urlCompBundle   = 'https://spa.js.org/seed-bundle/'+compBaseBundle;
const appZipFile      = path.resolve(spaDownloadFldr, appBaseBundle);
const compZipFile     = path.resolve(spaDownloadFldr, compBaseBundle);
const urlSpaJsBundle  = 'https://cdn.jsdelivr.net/gh/sucom/SPA.js@latest/dist/spa-bundle.min.js';
let appName, componentNames, compHtmTemplate, compCssTemplate, compJsTemplate, customAppBundle, customCompBundle;

// Ensure downloads directory exists
fs.ensureDirSync(spaDownloadFldr);

if (args['zip']) {
  appName = argv[0];
  zipApp();
} else if (args['reg'] || args['regzip']) {
  regRightClickZip();
} else if (args['regls']) {
  regRightClickLiveServer();
} else if (args['update']) {
  appName = argv[0];
  updateSpaJs();
} else if (args['app']) {
  if (args['reset']) {
    appName = '';
    downloadNewSpaApp();
  } else {
    customAppBundle = argv[0];
    if (customAppBundle && ((/(.)+\.zip$/i).test(customAppBundle))) {
      useCustomAppBundle();
    } else {
      showUsage();
    }
  }
} else if (args['component']) {
  if (args['reset']) {
    componentNames = '';
    downloadNewSpaComponent();
  } else {
    customCompBundle = argv[0];
    if (customCompBundle && ((/(.)+\.zip$/i).test(customCompBundle))) {
      useCustomComponentBundle();
    } else {
      showUsage();
    }
  }
} else if (args['reset']) {
  appName = '';
  componentNames = '';
  downloadNewSpaApp();
  downloadNewSpaComponent();
} else if (args['bundle']) {
  appName = argv[0];
  zipBundle();
}
else {
  if (argv.length == 1) {
    const appNameComponents = argv[0].split('/');
    appName = appNameComponents.shift();
    componentNames = appNameComponents.join('/');
    createApp();
  } else if (argv.length == 2) {
    appName = argv[0];
    componentNames = argv[1];
    createComponents();
  } else {
    showUsage();
  }
}

//=================================================================
function showUsage() {
  fs.readFile(path.resolve(__dirname, 'README.md'), function(err, data){
    console.log(data.toString());
  });
}

function logMsg(msg, clear) {
  if (clear===0) console.log('');
  process.stdout.write(msg);
  if (clear===1) console.log('');
}
//--------------------------------------------------------------------
function getFreePort(callbackFn){
  const server = net.createServer();
  let calledFn = false;
  const callback = function(err, port){
    if (!calledFn) {
      calledFn = true;
      callbackFn(err, port);
    }
  };

  server.on('error', function(err){
    server.close();
    callback(err);
  });

  server.listen(0, function(){
    const port = server.address().port;
    server.close();
    if (!calledFn) {
      if (port) {
        callback(null, port);
      } else {
        callback(new Error('Unable to get the server port'));
      }
    }
  });
}

function liveServerStart( cbFn ){
  if (appName) {
    try {
      console.log('Starting Live Server ... ...');
      const liveServer = require('live-server');
      if (liveServer) {
        getFreePort(function(err, appPort) {
          if (err) {
            if (cbFn) cbFn();
            throw err;
          }
          const defBrowser = (args['ch'] || args['chrome'])? 'chrome' : ((args['ff'] || args['firefox'])? 'firefox' : ((args['ie'] || args['iexplore'])? 'iexplore' : ''));
          const serverOptions = {
            port: appPort,
            host: "0.0.0.0",
            root: path.resolve(appName),
            browser: defBrowser,
            cors: true,
            open: true,
            ignore: '',
            file: "index.html",
            logLevel: 2
          };
          liveServer.start(serverOptions);
          if (cbFn) cbFn();
        });
      } else {
        console.log('Missing live-server module.\nInstall live-server and try again.\nlive-server install command:> npm install -g live-server');
      }
    } catch(e){
      console.log(e);
      console.log('----------------------------------------\nInstall live-server and try again.\nlive-server install command:> npm install -g live-server');
      console.log('NOTE: you may need to run install command as root/Administrator.')
    }
  } else {
    showUsage();
  }
}
//--------------------------------------------------------------------
async function regRightClickZip(){
  try {
    await unzip(path.resolve(spaCliRootFldr, 'win', 'spaclicmdreg.zip'),
          {dir: path.resolve('c:\\', 'spa-cli') });
    
    const { exec  } = require('child_process');
    const regCmd = path.resolve(spaCliRootFldr, 'win', 'rightClickZip.reg');
    exec(regCmd, (err) => {
      if (err) {
        throw err;
      }
      console.log('Folder Context-Menu [Zip-Now] has been registered.');
    });
  } catch (err) {
    console.error('Error in regRightClickZip:', err);
  }
}

async function regRightClickLiveServer(){
  try {
    await unzip(path.resolve(spaCliRootFldr, 'win', 'spaclicmdreg.zip'),
          {dir: path.resolve('c:\\', 'spa-cli') });
    
    const { exec  } = require('child_process');
    const regCmd = path.resolve(spaCliRootFldr, 'win', 'rightClickLiveServer.reg');
    exec(regCmd, (err) => {
      if (err) {
        throw err;
      }
      console.log('Folder Context-Menu [Live-Server Start] has been registered.');
    });
  } catch (err) {
    console.error('Error in regRightClickLiveServer:', err);
  }
}
//--------------------------------------------------------------------
function zipApp(){
  if (appName) {
    appName = appName.substring(appName.lastIndexOf('\\')+1);
    logMsg('Zipping folder: '+appName+' ... ', 0);
    const targetFileName = appName+'-'+(moment().format('YMMDD-HHmmss'));
    const output = fs.createWriteStream(targetFileName+'.zipx');
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', function () {
      logMsg(" ... Done.", 1);
    });

    archive.on('error', function(err){
      throw err;
    });

    archive.pipe(output);
    archive.directory(appName, targetFileName);
    archive.finalize();
  }
}

//--------------------------------------------------------------------
async function zipBundle(){
  if (appName) {
    appName = appName;
    logMsg('Bundling folder: '+appName+' ... ', 0);

    const targetFileName    = appName;
    const bundleZipFile     = targetFileName+'.zip';
    const bundleZipFilePath = path.resolve(bundleZipFile);

    try {
      const exists = await fs.pathExists(bundleZipFilePath);
      if (exists) {
        logMsg('Bundle ['+targetFileName+'] already found.', 0);
      } else {
        const output = fs.createWriteStream(bundleZipFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', function () {
          logMsg(" ... Done.", 1);
        });

        archive.on('error', function(err){
          throw err;
        });

        archive.pipe(output);
        archive.directory(appName+'/', false);
        archive.finalize();
      }
    } catch (err) {
      throw err;
    }
  }
}
//--------------------------------------------------------------------
async function createApp(){
  try {
    await fs.ensureDir(appName);
    console.log('Creating a new SPA: '+appName);

    if (args['new']) {
      await downloadNewSpaApp();
    } else {
      const exists = await fs.pathExists(appZipFile);
      if (exists) {
        await extractAndBuildSpaApp();
      } else {
        await downloadNewSpaApp();
      }
    }
  } catch (err) {
    if (err.code === 'EEXIST') {
      console.log('Application already exists!');
      if (args['start']) {
        liveServerStart( createComponents );
      } else {
        createComponents();
      }
      return;
    }
    throw err;
  }
}

async function downloadNewSpaApp(){
  logMsg('Downloading SPA App boilerplate ... ', 1);
  try {
    const response = await axios({
      method: 'GET',
      url: urlAppBundle,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(appZipFile);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    logMsg('Downloaded SPA App boilerplate.', 1);
    await extractAndBuildSpaApp();
  } catch (err) {
    console.error('Download failed:', err);
  }
}

async function extractAndBuildSpaApp(){
  if (appName) {
    const appRootFldr = path.resolve(appName);
    try {
      await unzip(appZipFile, {dir: appRootFldr});
      console.log('SPA ['+appName+'] is ready.');
      if (args['start']) {
        liveServerStart(async function(){
          await updateSpaJs();
          await createComponents();
        });
      } else {
        await updateSpaJs();
        await createComponents();
      }
    } catch (err) {
      console.error('Extraction failed:', err);
    }
  }
}

async function updateSpaJs(){
  const appRootFldr = path.resolve(appName);
  const spaJsPath = path.resolve(appRootFldr, 'xlib', 'spa', 'spa-bundle.min.js');
  
  logMsg('Downloading Latest SPA JS bundle ... ', 1);
  try {
    const response = await axios({
      method: 'GET',
      url: urlSpaJsBundle,
      responseType: 'stream'
    });

    await fs.ensureDir(path.dirname(spaJsPath));
    const writer = fs.createWriteStream(spaJsPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    logMsg('Downloaded Latest SPA JS bundle.', 1);
  } catch (err) {
    console.error('SPA JS download failed:', err);
  }
}

async function createComponents(){
  if (componentNames) {
    if (args['new']) {
      await downloadNewSpaComponent();
    } else {
      try {
        const exists = await fs.pathExists(compZipFile);
        if (exists) {
          await createRequestedComponents();
        } else {
          await downloadNewSpaComponent();
        }
      } catch (err) {
        throw err;
      }
    }
  }
}

async function downloadNewSpaComponent(){
  logMsg('Downloading SPA Component boilerplate ... ',1);
  try {
    const response = await axios({
      method: 'GET',
      url: urlCompBundle,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(compZipFile);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    logMsg('Downloaded SPA Component boilerplate.',1);
    
    const compExtractDir = path.resolve(spaDownloadFldr, 'componentX');
    await fs.ensureDir(compExtractDir);
    await unzip(compZipFile, {dir: compExtractDir});
    await createRequestedComponents();
  } catch (err) {
    console.error('Component download failed:', err);
  }
}

async function createRequestedComponents(){
  if (componentNames) {
    const srcCompFldr = path.resolve(spaDownloadFldr, 'componentX');
    const srcHtmFile  = path.resolve(srcCompFldr, 'componentX.html');
    const srcCssFile  = path.resolve(srcCompFldr, 'componentX.css');
    const srcJsFile   = path.resolve(srcCompFldr, 'componentX.js');

    compJsTemplate  = '';
    compHtmTemplate = '';
    compCssTemplate = '-SKIP-';

    try {
      if (await fs.pathExists(srcJsFile)) {
        compJsTemplate = await fs.readFile(srcJsFile, 'utf8');
      }

      if (await fs.pathExists(srcHtmFile)) {
        compHtmTemplate = await fs.readFile(srcHtmFile, 'utf8');
      }

      if (await fs.pathExists(srcCssFile)) {
        compCssTemplate = await fs.readFile(srcCssFile, 'utf8');
      }

      const componentsArray = componentNames.split(',');
      for (const componentName of componentsArray) {
        await createComponent(componentName);
      }
    } catch (err) {
      console.error('Error creating components:', err);
    }
  }
}

function isValidComponent(componentName){
  let isValid = false;
  const reservedCompNames = 'api,debug,lang';
  const hasInvalidChars   = (/[^a-z0-9\/]/gi).test(componentName);
  const isReservedName    = (reservedCompNames.indexOf(componentName)>=0);
  
  if (hasInvalidChars) {
    console.log('Invalid component name ['+componentName+']. Component name must be alpha-numeric ONLY [a-z A-Z 0-9].');
  } else if (!(/^([a-z])/i.test(componentName))) {
    console.log('Invalid component name ['+componentName+']. Component name must begin with alphabet [a-z A-Z].');
  } else if (isReservedName) {
    console.log('Invalid component name ['+componentName+']. Component name is reserved. Use any name other than ['+reservedCompNames+'].');
  }  else {
    isValid = true;
  }
  return isValid;
}

function createParentFolder(folderPath){
  if (folderPath) {
    const folderPathArr = folderPath.substring(folderPath.indexOf(':')+1).replace(/\\/g,'/').split('/');
    let pFldr = path.isAbsolute(folderPath) ? path.parse(folderPath).root : '/';
    
    for(let idx = 0; idx < folderPathArr.length - 1; idx++){
      if (folderPathArr[idx]) {
        pFldr = path.resolve(pFldr, folderPathArr[idx]);
        try {
          fs.ensureDirSync(pFldr);
        } catch(e) {
          // Directory already exists or other error
        }
      }
    }
  }
}

async function createComponent(componentName){
  if (isValidComponent(componentName)) {
    componentName = componentName.replace(/[^a-z0-9]/gi, '_');
    const componentPath = componentName.replace(/[^a-z0-9]/gi, '/');
    const newCompFldr   = path.resolve(appName, 'app', 'components', componentPath);
    let componentFile = componentName;

    if ((/[^a-z0-9]/gi).test(componentName)) {
      const xPath = componentName.split('_');
      componentFile = xPath[xPath.length-1];
    }
    
    const newHtmFile = path.resolve(newCompFldr, componentFile+'.html');
    const newCssFile = path.resolve(newCompFldr, componentFile+'.css');
    const newJsFile  = path.resolve(newCompFldr, componentFile+'.js');

    const compHTM = compHtmTemplate.replace(/componentXpath/g, componentPath).replace(/componentXfile/g, componentFile).replace(/componentX/g, componentName);
    const compCSS = compCssTemplate.replace(/componentXpath/g, componentPath).replace(/componentXfile/g, componentFile).replace(/componentX/g, componentName);
    const compJS  = compJsTemplate.replace(/componentXpath/g, componentPath).replace(/componentXfile/g, componentFile).replace(/componentX/g, componentName);

    createParentFolder(newCompFldr);

    try {
      await fs.ensureDir(newCompFldr);
      console.log('Creating a new component: '+componentPath);

      // Create files
      if (compCSS !== '-SKIP-') {
        await fs.writeFile(newCssFile, compCSS);
      }

      await fs.writeFile(newHtmFile, compHTM);
      await fs.writeFile(newJsFile, compJS);

    } catch (err) {
      if (err.code === 'EEXIST') {
        console.error('Component ['+componentPath+'] already exists!');
      } else if (err.code === 'ENOENT') {
        console.error('SPA ['+appName+'] not available!');
        await createApp();
      } else {
        throw err;
      }
    }
  }
}

//-----------------------------------------------
async function useCustomAppBundle(){
  if (customAppBundle) {
    logMsg('Updating Component Bundle with '+customAppBundle+'', 1);
    const customAppBundleSrc = path.resolve(customAppBundle);
    try {
      const exists = await fs.pathExists(customAppBundleSrc);
      if (exists) {
        await fs.copy(customAppBundleSrc, appZipFile);
        logMsg('Custom App Bundle is ready to use.', 1);
      }
    } catch (err) {
      console.error('Error using custom app bundle:', err);
    }
  }
}

async function useCustomComponentBundle(){
  if (customCompBundle) {
    logMsg('Updating Component Bundle with '+customCompBundle+'', 1);
    const customCompBundleSrc = path.resolve(customCompBundle);
    
    try {
      const exists = await fs.pathExists(customCompBundleSrc);
      if (exists) {
        const srcCompFldr = path.resolve(spaDownloadFldr, 'componentX');
        const oldCssFile = path.resolve(srcCompFldr, 'componentX.css');
        
        try {
          await fs.remove(oldCssFile);
        } catch(err) { /* Ignore if file doesn't exist */ }
        
        await fs.ensureDir(srcCompFldr);
        await unzip(customCompBundleSrc, {dir: srcCompFldr});
        await fs.copy(customCompBundleSrc, compZipFile);
        logMsg('Custom Component Bundle is ready to use.', 1);
      }
    } catch (err) {
      console.error('Error using custom component bundle:', err);
    }
  }
}