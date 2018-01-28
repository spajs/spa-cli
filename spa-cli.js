#!/usr/bin/env node

var args            = require('minimist')(process.argv.slice(2)),
    fs              = require('fs'),
    path            = require('path'),
    download        = require('download'),
    archiver        = require('archiver'),
    unzip           = require('extract-zip'),
    fileExists      = require('file-exists'),
    moment          = require('moment'),
    argv            = args._,
    urlAppBundle    = 'https://spa.js.org/seed-bundle/spa-app.zip',
    urlCompBundle   = 'https://spa.js.org/seed-bundle/spa-component.zip',
    urlSpaJsBundle  = 'https://cdn.jsdelivr.net/gh/sucom/SPA.js@latest/dist/spa-bundle.min.js',
    spaCliRootFldr  = __dirname,
    spaDownloadFldr = path.resolve(spaCliRootFldr, 'downloads'),
    appZipFile      = path.resolve(spaDownloadFldr, 'spa-app.zip'),
    compZipFile     = path.resolve(spaDownloadFldr, 'spa-component.zip'),
    appName, componentNames, compHtmTemplate, compCssTemplate, compJsTemplate, lastLogMsg='';

if (args['zip']) {
  appName = argv[0];
  zipApp();
} else if (args['reg']) {
  regRightClick();
} else if (args['update']) {
  appName = argv[0];
  updateSpaJs();
} else {
  switch (argv.length) {
    case 1:
      var appNameComponents = argv[0].split('/', 2);
      appName = appNameComponents[0];
      componentNames = appNameComponents[1];
      createApp();
    break;

    case 2:
      appName = argv[0];
      componentNames = argv[1];
      createComponents();
    break;

    default: //no arguments. show usage
      fs.readFile(path.resolve(__dirname, 'README.md'), function(err, data){
        console.log(data.toString());
      });
    break;
  }
}

//=================================================================
function logMsg(msg, clear) {
  if (clear===0) console.log('');
  process.stdout.write(msg);
  if (clear===1) console.log('');
}

function regRightClick(){
  unzip(path.resolve(spaCliRootFldr, 'win', 'rightClickZip.zip'),
       {dir: path.resolve('c:\\', 'spa-cli') }, function(){
    const { exec  } = require('child_process');
    var regCmd = path.resolve(spaCliRootFldr, 'win', 'rightClickZip.reg');
    exec(regCmd, (err) => {
      if (err) {
        throw err;
      }
      console.log('Folder Context-Menu [Zip-Now] has been registered.');
    });
  });
}

function zipApp(){
  if (appName) {
    appName = appName.substring(appName.lastIndexOf('\\')+1);
    logMsg('Zipping folder: '+appName+' ... ', 0);
    var targetFileName = appName+'-'+(moment().format('YMMDD-hhmmss')),
        output = fs.createWriteStream(targetFileName+'.zipx'),
        archive = archiver('zip', { zlib: { level: 9 } });

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

function createApp(){
  fs.mkdir(appName, (err)=>{
    if (err) {
      if (err.code === 'EEXIST') {
        console.error('Application already exists!');
        if (componentNames) { createComponents(); }
        return;
      }
      throw err;
    }
    console.log('Creating a new SPA: '+appName);

    if (args['new']) {
      downloadNewSpaApp();
    } else {
      fileExists(appZipFile, (err, exists) => {
        if (err) throw err;
        if (exists) {
          extractAndBuildSpaApp();
        } else {
          downloadNewSpaApp();
        }
      });
    }
  });
}

function downloadNewSpaApp(){
  logMsg('Downloading SPA App boilerplate ... ', 0);
  download(urlAppBundle, spaDownloadFldr).then(()=>{
    logMsg('... Done.', 1);
    extractAndBuildSpaApp();
  });
}

function extractAndBuildSpaApp(){
  var appRootFldr = path.resolve(appName);
  unzip(appZipFile, {dir: appRootFldr}, function(){
    console.log('SPA ['+appName+'] is ready.');
    updateSpaJs();
    createComponents();
  });
}

function updateSpaJs() {
  var appRootFldr = path.resolve(appName);
  logMsg('Downloading Latest SPA JS bundle ... ', 0);
  download(urlSpaJsBundle, path.resolve(appRootFldr, 'xlib', 'spa')).then(()=>{
    logMsg('... Done.', 1);
  });
}

function createComponents(){
  if (componentNames) {
    if (args['new']) {
      downloadNewSpaComponent();
    } else {
      fileExists(compZipFile, (err, exists) => {
        if (err) throw err;
        if (exists) {
          createRequestedComponents();
        } else {
          downloadNewSpaComponent();
        }
      });
    }
  }
}

function downloadNewSpaComponent(){
  logMsg('Downloading SPA Component boilerplate ... ',0);
  download(urlCompBundle, spaDownloadFldr).then(()=>{
    logMsg('... Done.', 1);
    unzip(compZipFile, {dir: path.resolve(spaDownloadFldr, 'componentX') }, function(){
      createRequestedComponents();
    });
  });
}

function createRequestedComponents(){
  if (componentNames) {
    var srcCompFldr = path.resolve(spaDownloadFldr, 'componentX'),
        srcHtmFile  = path.resolve(srcCompFldr, 'componentX.html'),
        srcCssFile  = path.resolve(srcCompFldr, 'componentX.css'),
        srcJsFile   = path.resolve(srcCompFldr, 'componentX.js');

    compHtmTemplate = fs.readFileSync(srcHtmFile).toString();
    compCssTemplate = fs.readFileSync(srcCssFile).toString();
    compJsTemplate  = fs.readFileSync(srcJsFile).toString();

    var componentsArray = componentNames.split(',');
    componentsArray.forEach(componentName => {
      createComponent(componentName);
    });
  }
}

function isValidComponent(componentName){
  var isValid = false,
      reservedCompNames = 'api,debug,lang,utils',
      hasInvalidChars   = (componentName.replace(/[a-z0-9]/gi, '')).length,
      isReservedName    = (reservedCompNames.indexOf(componentName)>=0);
  if (hasInvalidChars) {
    console.log('Invalid component name [componentName]. Component name must be alpha-numeric ONLY.');
  } else if (isReservedName) {
    console.log('Invalid component name [componentName]. Component name is reserved. Use any name other than ['+reservedCompNames+'].');
  } else {
    isValid = true;
  }
  return isValid;
}

function createComponent(componentName){
  if (isValidComponent(componentName)) {
    var newCompFldr = path.resolve(appName, 'app', 'components', componentName),
        newHtmFile  = path.resolve(newCompFldr, componentName+'.html'),
        newCssFile  = path.resolve(newCompFldr, componentName+'.css'),
        newJsFile   = path.resolve(newCompFldr, componentName+'.js');

    var compHTM = compHtmTemplate.replace(/componentX/g, componentName),
        compCSS = compCssTemplate.replace(/componentX/g, componentName),
        compJS  = compJsTemplate.replace(/componentX/g, componentName);

    fs.mkdir(newCompFldr, (err)=>{
      if (err) {
        if (err.code === 'EEXIST') {
          console.error('Component ['+componentName+'] already exists!');
          return;
        } else if (err.code === 'ENOENT') {
          console.error('SPA ['+appName+'] not available!');
          createApp();
          return;
        }
        throw err;
      }
      console.log('Creating a new component: '+componentName);

      //Create css
      fs.writeFile(newCssFile, compCSS, function(err){
        if (err) throw err;
      });

      //create html
      fs.writeFile(newHtmFile, compHTM, function(err){
        if (err) throw err;
      });

      //create js
      fs.writeFile(newJsFile, compJS, function(err){
        if (err) throw err;
      });

    });

  }//isValid componentName
}