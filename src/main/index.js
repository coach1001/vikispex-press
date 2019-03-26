'use strict';
import { app, BrowserWindow, ipcMain } from 'electron';
import fs from 'fs';

const math = require('mathjs');
const crc16 = require('js-crc').crc16;
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
var Stopwatch = require('statman-stopwatch');
// 9600, 14400, 19200, 38400, 57600, 115200

let port;
let parser;
let configuration;
let testStopwatch;
let load = [];
let displacement = [];
let limits = [];

let dataOut = {
  pwm0: 0, // 16bit
  pwm1: 0, // 16bit
  r0: 0, // RELAY
  r1: 0, // OnB SSR
  r2: 0, // OnB SSR
  r3: 0 // OffB SSR
};
let dataIn = {
  adc0: 0, // 32bit
  adc1: 0, // 16bit
  adc2: 0, // 16bit
  adc3: 0, // 16bit
  sw0: 0, // 0 or 1
  sw1: 0 // 0 or 1
};

let directionChannels;
let motorChannels;
let rxTimeout;
let sDataIn;
let state = {
  state: 'manual',
  subState: 0
};

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path')
    .join(__dirname, '/static')
    .replace(/\\/g, '\\\\');
}

function openPort() {
  port.open(() => {
    port.flush(() => {
      sendData();
    });
  });
}

function approxRollingAverage(oldAverage, newSample, samples) {
  if (!oldAverage) oldAverage = 0;
  return (oldAverage * (samples - 1)) / samples + newSample / samples;
}

function readConfiguration() {
  const configurationRaw = fs.readFileSync('./configuration.json');
  configuration = JSON.parse(configurationRaw);
  port = new SerialPort(configuration.machineSettings.commPort, { baudRate: configuration.machineSettings.baudRate, autoOpen: false });
  parser = port.pipe(new Readline({ delimiter: '\n' }));
  parser.on('data', data => {
    clearTimeout(rxTimeout);
    sDataIn = data.split(' ');
    dataIn.adc0 = parseInt(sDataIn[0], 16);
    dataIn.adc1 = parseInt(sDataIn[1], 16);
    dataIn.adc2 = parseInt(sDataIn[2], 16);
    dataIn.adc3 = parseInt(sDataIn[3], 16);
    dataIn.sw0 = parseInt(sDataIn[4], 16);
    dataIn.sw1 = parseInt(sDataIn[5], 16);
    parseData();
    processState();
    sendData();
  });
  configuration.machineSettings.load.channels.forEach(() => {
    load.push({ rawZero: 0 });
  });
  configuration.machineSettings.displacement.channels.forEach(() => {
    displacement.push({ rawZero: 0 });
  });
  configuration.machineSettings.limits.channels.forEach(() => {
    limits.push({});
  });
  directionChannels = configuration.machineSettings.direction.channels;
  motorChannels = configuration.machineSettings.motor.channels;
  testStopwatch = new Stopwatch();
  testStopwatch.start();
  openPort();
}

function sendData() {
  let sOutDelimited =
    `${dataOut.pwm0.toString(16)} ` +
    `${dataOut.pwm1.toString(16)} ` +
    `${dataOut.r0.toString(16)} ` +
    `${dataOut.r1.toString(16)} ` +
    `${dataOut.r2.toString(16)} ` +
    `${dataOut.r3.toString(16)} `;
  let sOutNonDelimited =
    `${dataOut.pwm0.toString(16)}` +
    `${dataOut.pwm1.toString(16)}` +
    `${dataOut.r0.toString(16)}` +
    `${dataOut.r1.toString(16)}` +
    `${dataOut.r2.toString(16)}` +
    `${dataOut.r3.toString(16)}`;
  sOutDelimited += `${crc16(sOutNonDelimited)}\n`;
  port.write(`$${sOutDelimited}`);
  rxTimeout = setTimeout(() => {
    sendData();
  }, 50);
}

function processState() {
  switch (state.state) {
    case 'manual':
      manual();
      break;
    default:
      break;
  }
}

let mainWindow;
const winURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`;

function parseData() {
  configuration.machineSettings.load.channels.forEach((channel, idx) => {
    load[idx].rawValue = approxRollingAverage(load[idx].rawValue, dataIn[channel.dataChannel], channel.samples);
    load[idx].rawZerod = load[idx].rawValue - load[idx].rawZero;
    load[idx].realValue = math
      .eval(channel.calc, {
        value: load[idx].rawValue,
        coffA: channel.coffA,
        coffB: channel.coffB,
        coffC: channel.coffC,
        coffD: channel.coffD
      })
      .toFixed(channel.realValuePrecision);
    load[idx].realZerod = math
      .eval(channel.calc, {
        value: load[idx].rawZerod,
        coffA: channel.coffA,
        coffB: channel.coffB,
        coffC: channel.coffC,
        coffD: channel.coffD
      })
      .toFixed(channel.realValuePrecision);
  });
  configuration.machineSettings.displacement.channels.forEach((channel, idx) => {
    displacement[idx].rawValue = approxRollingAverage(displacement[idx].rawValue, dataIn[channel.dataChannel], channel.samples);
    displacement[idx].rawZerod = displacement[idx].rawValue - load[idx].rawZero;
    displacement[idx].realValue = math
      .eval(channel.calc, {
        value: displacement[idx].rawValue,
        dataMin: channel.dataMin,
        dataMax: channel.dataMax,
        length: channel.length
      })
      .toFixed(channel.realValuePrecision);
    displacement[idx].realZerod = math
      .eval(channel.calc, {
        value: displacement[idx].rawZerod,
        dataMin: channel.dataMin,
        dataMax: channel.dataMax,
        length: channel.length
      })
      .toFixed(channel.realValuePrecision);
  });
  configuration.machineSettings.limits.channels.forEach((channel, idx) => {
    limits[idx].active = dataIn[channel.dataChannel] === channel.active;
  });
}

function createUiData() {
  let uiLoad = [];
  let uiDisplacement = [];
  load.forEach(l => {
    uiLoad.push({
      realValue: l.realValue,
      realZerod: l.realZerod
    });
  });
  displacement.forEach(d => {
    uiDisplacement.push({
      realValue: d.realValue,
      realZerod: d.realZerod
    });
  });
  return {
    uiLoad,
    uiDisplacement,
    uiLimits: limits,
    uiState: state
  };
}

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 768,
    useContentSize: false,
    width: 1280
    // frame: false
  });

  mainWindow.loadURL(winURL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  ipcMain.on('exit-application', () => {
    app.exit();
  });

  ipcMain.on('data-get', (event, arg) => {
    event.sender.send('data-get-reply', createUiData());
  });

  ipcMain.on('data-set', (event, arg) => {
    Object.assign(dataOut, arg);
  });

  ipcMain.on('reconnect', (event, arg) => {
    port.flush(error => {
      console.log(error);
      port.close(error_ => {
        console.log(error_);
        openPort();
      });
    });
  });

  ipcMain.on('tests-data', event => {
    event.sender.send('tests-data-reply', configuration.tests);
  });

  ipcMain.on('set-state', (event, arg) => {
    state = arg;
  });

  readConfiguration();
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    port.close(error => {
      console.log(error);
      console.log('Serial Port Closed!...');
      app.quit();
    });
  } else {
    port.close(error => {
      console.log(error);
      console.log('Serial Port Closed!...');
    });
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// ******************************* MACHINE FUNCTIONS ********************************************************* //
function idle() {
  directionChannels.forEach(channel => {
    dataOut[channel.dataChannel] = channel.idle;
    dataOut[motorChannels[channel.motorChannel].dataChannel] = 0;
  });
}

function manualAdvance() {
  directionChannels.forEach(channel => {
    dataOut[channel.dataChannel] = channel.forward;
    dataOut[motorChannels[channel.motorChannel].dataChannel] = motorChannels[channel.motorChannel].manual;
  });
}

function manualReverse() {
  directionChannels.forEach(channel => {
    dataOut[channel.dataChannel] = channel.reverse;
    dataOut[motorChannels[channel.motorChannel].dataChannel] = motorChannels[channel.motorChannel].manual;
  });
}
// ******************************* MACHINE FUNCTIONS END ***************************************************** //

// ******************************* STATE FUNCTIONS *********************************************************** //
function manual() {
  switch (state.subState) {
    // IDLE
    case 0:
      idle();
      break;
    // MANUAL ADVANCE
    case 1:
      manualAdvance();
      break;
    // MANUAL REVERSE
    case 2:
      manualReverse();
      break;
  }
}

// ******************************* STATE FUNCTIONS END ******************************************************* //

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
