#!/usr/bin/env node

var args            = require('minimist')(process.argv.slice(2)),
    fs              = require('fs'),
    path            = require('path'),
    download        = require('download'),
    archiver        = require('archiver'),
    unzip           = require('extract-zip'),
    fileExists      = require('file-exists'),
    moment          = require('moment'),
    net             = require('net'),

    appBaseBundle   = 'spa-app-base.zip',
    compBaseBundle  = 'spa-component-base.zip',

    argv            = args._,
    spaCliRootFldr  = __dirname,
    spaDownloadFldr = path.resolve(spaCliRootFldr, 'downloads'),
    urlAppBundle    = 'https://spa.js.org/seed-bundle/'+appBaseBundle,
    urlCompBundle   = 'https://spa.js.org/seed-bundle/'+compBaseBundle,
    appZipFile      = path.resolve(spaDownloadFldr, appBaseBundle),
    compZipFile     = path.resolve(spaDownloadFldr, compBaseBundle),
    urlSpaJsBundle  = 'https://cdn.jsdelivr.net/gh/sucom/SPA.js/dist/spa-bundle.min.js',
    appName, componentNames, compHtmTemplate, compCssTemplate, compJsTemplate, customAppBundle, customCompBundle;

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
}
else {
  if (argv.length == 1) {
    var appNameComponents = argv[0].split('/');
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
  var server = net.createServer(),
      calledFn = false,
      callback = function(err, port){
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
    var port = server.address().port;
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
      var liveServer = require('live-server');
      if (liveServer) {
        getFreePort(function(err, appPort) {
          if (err) {
            if (cbFn) cbFn();
            throw err;
          }
          var defBrowser = (args['ch'] || args['chrome'])? 'chrome' : ((args['ff'] || args['firefox'])? 'firefox' : ((args['ie'] || args['iexplore'])? 'iexplore' : '')),
              serverOptions = {
                port: appPort, // Set the server port. Defaults to 8080.
                host: "0.0.0.0", // Set the address to bind to. Defaults to 0.0.0.0 or process.env.IP.
                root: path.resolve(appName), // Set root directory that's being served. Defaults to cwd.
                browser: defBrowser,
                cors: true,  //Enable CORS
                open: true, // When false, it won't load your browser by default.
                ignore: '', // comma-separated string for paths to ignore
                file: "index.html", // When set, serve this file (server root relative) for every 404 (useful for single-page applications)
                logLevel: 2 // 0 = errors only, 1 = some, 2 = lots
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
function regRightClickZip(){
  unzip(path.resolve(spaCliRootFldr, 'win', 'spaclicmdreg.zip'),
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
function regRightClickLiveServer(){
  unzip(path.resolve(spaCliRootFldr, 'win', 'spaclicmdreg.zip'),
        {dir: path.resolve('c:\\', 'spa-cli') }, function(){
    const { exec  } = require('child_process');
    var regCmd = path.resolve(spaCliRootFldr, 'win', 'rightClickLiveServer.reg');
    exec(regCmd, (err) => {
      if (err) {
        throw err;
      }
      console.log('Folder Context-Menu [Live-Server Start] has been registered.');
    });
  });
}
//--------------------------------------------------------------------
function zipApp(){
  if (appName) {
    appName = appName.substring(appName.lastIndexOf('\\')+1);
    logMsg('Zipping folder: '+appName+' ... ', 0);
    var targetFileName = appName+'-'+(moment().format('YMMDD-HHmmss')),
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
//--------------------------------------------------------------------
function createApp(){
  fs.mkdir(appName, (err)=>{
    if (err) {
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
  logMsg('Downloading SPA App boilerplate ... ', 1);
  download(urlAppBundle, spaDownloadFldr).then(()=>{
    logMsg('Downloaded SPA App boilerplate.', 1);
    extractAndBuildSpaApp();
  });
}

function extractAndBuildSpaApp(){
  if (appName) {
    var appRootFldr = path.resolve(appName);
    unzip(appZipFile, {dir: appRootFldr}, function(){
      console.log('SPA ['+appName+'] is ready.');
      if (args['start']) {
        liveServerStart(function(){
          updateSpaJs();
          createComponents();
        });
      } else {
        updateSpaJs();
        createComponents();
      }
    });
  }
}

function updateSpaJs(){
  var appRootFldr = path.resolve(appName);
  logMsg('Downloading Latest SPA JS bundle ... ', 1);
  download(urlSpaJsBundle, path.resolve(appRootFldr, 'xlib', 'spa')).then(()=>{
    logMsg('Downloaded Latest SPA JS bundle.', 1);
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
  logMsg('Downloading SPA Component boilerplate ... ',1);
  download(urlCompBundle, spaDownloadFldr).then(()=>{
    logMsg('Downloaded SPA Component boilerplate.',1);
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

    compJsTemplate  = '';
    compHtmTemplate = '';
    compCssTemplate = '-SKIP-';

    fileExists(srcJsFile, (err, exists) => {
      if (exists) {
        compJsTemplate  = fs.readFileSync(srcJsFile).toString();
      }

      fileExists(srcHtmFile, (err, exists) => {
        if (exists) {
          compHtmTemplate = fs.readFileSync(srcHtmFile).toString();
        }

        fileExists(srcCssFile, (err, exists) => {
          if (exists) {
            compCssTemplate = fs.readFileSync(srcCssFile).toString()
          }

          var componentsArray = componentNames.split(',');
          componentsArray.forEach(componentName => {
            createComponent(componentName);
          });

        });

      });

    });

  }
}

function isValidComponent(componentName){
  var isValid = false,
      reservedCompNames = 'api,debug,lang',
      hasInvalidChars   = (/[^a-z0-9\/]/gi).test(componentName),
      isReservedName    = (reservedCompNames.indexOf(componentName)>=0);
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
    folderPathArr = folderPath.substring(folderPath.indexOf(':')+1).replace(/\\/g,'/').split('/');
    var pFldr='/';
    for(var idx=0; idx<folderPathArr.length-1; idx++){
      if (folderPathArr[idx]) {
        pFldr = path.resolve(pFldr, folderPathArr[idx]);
        try {
          fs.mkdirSync(pFldr, (err)=>{
            if (err) {
              if (err.code === 'EEXIST') {
                return;
              } else if (err.code === 'ENOENT') {
                console.error('Folder ['+pFldr+'] not found!');
                return;
              }
              throw err;
            }
            return;
          });

        } catch(e){};

      }
    }
  }
}

function createComponent(componentName){
  if (isValidComponent(componentName)) {
    componentName = componentName.replace(/[^a-z0-9]/gi, '_');
    var componentPath = componentName.replace(/[^a-z0-9]/gi, '/'),
        newCompFldr   = path.resolve(appName, 'app', 'components', componentPath),
        componentFile = componentName;

    if ((/[^a-z0-9]/gi).test(componentName)) {
      var xPath = componentName.split('_');
      componentFile = xPath[xPath.length-1];
    }
    var newHtmFile   = path.resolve(newCompFldr, componentFile+'.html'),
        newCssFile   = path.resolve(newCompFldr, componentFile+'.css'),
        newJsFile    = path.resolve(newCompFldr, componentFile+'.js');

    var compHTM = compHtmTemplate.replace(/componentXpath/g, componentPath).replace(/componentXfile/g, componentFile).replace(/componentX/g, componentName),
        compCSS = compCssTemplate.replace(/componentXpath/g, componentPath).replace(/componentXfile/g, componentFile).replace(/componentX/g, componentName),
        compJS  = compJsTemplate.replace(/componentXpath/g, componentPath).replace(/componentXfile/g, componentFile).replace(/componentX/g, componentName);

    createParentFolder(newCompFldr);

    fs.mkdir(newCompFldr, (err)=>{
      if (err) {
        if (err.code === 'EEXIST') {
          console.error('Component ['+componentPath+'] already exists!');
          return;
        } else if (err.code === 'ENOENT') {
          console.error('SPA ['+appName+'] not available!');
          createApp();
          return;
        }
        throw err;
      }
      console.log('Creating a new component: '+componentPath);

      //Create css
      if (compCSS != '-SKIP-') {
        fs.writeFile(newCssFile, compCSS, function(err){
          if (err) throw err;
        });
      }

      //create html
      fs.writeFile(newHtmFile, compHTM, function(err){
        if (err) throw err;
      });

      //create js
      fs.writeFile(newJsFile, compJS, function(err){
        if (err) throw err;
      });

    });

  }//else (isValid=false) => Invalid componentName
}

//-----------------------------------------------
function useCustomAppBundle(){
  if (customAppBundle) {
    logMsg('Updating Component Bundle with '+customAppBundle+'', 1);
    var customAppBundleSrc = path.resolve(customAppBundle);
    fileExists(customAppBundleSrc, (err, exists) => {
      if (err) throw err;
      if (exists) {
        fs.copyFile(customAppBundleSrc, appZipFile, (err) => {
          if (err) throw err;
          logMsg('Custom App Bundle is ready to use.', 1);
        });
      }
    });
  }
}

function useCustomComponentBundle(){
  if (customCompBundle) {
    logMsg('Updating Component Bundle with '+customCompBundle+'', 1);

    var customCompBundleSrc = path.resolve(customCompBundle);
    fileExists(customCompBundleSrc, (err, exists) => {
      if (err) throw err;
      if (exists) {
        var srcCompFldr = path.resolve(spaDownloadFldr, 'componentX')
          , oldCssFile  = path.resolve(srcCompFldr, 'componentX.css');
        try {
          fs.unlinkSync(oldCssFile);
        } catch(err) { }
        unzip(customCompBundleSrc, {dir: path.resolve(spaDownloadFldr, 'componentX') }, function(){
          fs.copyFile(customCompBundleSrc, compZipFile, (err) => {
            if (err) throw err;
            logMsg('Custom Component Bundle is ready to use.', 1);
          });
        });
      }
    });
  }
}
