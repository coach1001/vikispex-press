'use strict';
import { app, BrowserWindow, ipcMain } from 'electron';
import fs from 'fs';

const math = require('mathjs');
const crc16 = require('js-crc').crc16;
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
var Stopwatch = require('statman-stopwatch');

let port;
let parser;
let configuration;
let load = [];
let displacement = [];
let limit = [];
let cycleTimer;
let cycleCounter;
let endOfApplyLoadCycle;
let endOfRemoveLoadCycle;
let currentCycleState;
let currentCycleLimit;
let retryCounter;
let connected;

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
let loadChannels;
let displacementChannels;
let limitChannels;
let testData;

let rxTimeout;
let sDataIn;
let sDataInCrc;
let state = {
  state: 'MANUAL',
  subState: 'IDLE'
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

  directionChannels = configuration.machineSettings.direction.channels;
  motorChannels = configuration.machineSettings.motor.channels;
  loadChannels = configuration.machineSettings.load.channels;
  displacementChannels = configuration.machineSettings.displacement.channels;
  limitChannels = configuration.machineSettings.limit.channels;

  loadChannels.forEach(() => {
    load.push({ rawZero: 0 });
  });
  displacementChannels.forEach(() => {
    displacement.push({ rawZero: 0 });
  });
  limitChannels.forEach(() => {
    limit.push({});
  });
  port = new SerialPort(configuration.machineSettings.commPort, { baudRate: configuration.machineSettings.baudRate, autoOpen: false });
}

function initialize() {
  connected = false;
  readConfiguration();
  parser = port.pipe(new Readline({ delimiter: '\n' }));
  parser.on('data', data => {
    clearTimeout(rxTimeout);
    retryCounter = 0;
    connected = true;
    sDataIn = data.split(' ');
    sDataInCrc = '';
    for (let i = 0; i < sDataIn.length - 1; i++) {
      sDataInCrc += sDataIn[i];
    }
    const crcIn = sDataIn[sDataIn.length - 1];
    const crcCalcIn = crc16(sDataInCrc);
    if (crcIn === crcCalcIn) {
      dataIn.adc0 = parseInt(sDataIn[0], 16);
      dataIn.adc1 = parseInt(sDataIn[1], 16);
      dataIn.adc2 = parseInt(sDataIn[2], 16);
      dataIn.adc3 = parseInt(sDataIn[3], 16);
      dataIn.sw0 = parseInt(sDataIn[4], 16);
      dataIn.sw1 = parseInt(sDataIn[5], 16);
      parseData();
      processState();
    }
    sendData();
  });
  cycleTimer = new Stopwatch();
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
    retryCounter += 1;
    if (retryCounter > 200) {
      retryCounter = 0;
      connected = false;
      clearTimeout(rxTimeout);
      mainWindow.webContents.send('connection-lost');
    } else {
      sendData();
    }
  }, 50);
}

let mainWindow;
const winURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`;

function parseData() {
  loadChannels.forEach((channel, idx) => {
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
    load[idx].primary = channel.primary;
    load[idx].unit = channel.unit;
  });
  displacementChannels.forEach((channel, idx) => {
    displacement[idx].rawValue = approxRollingAverage(displacement[idx].rawValue, dataIn[channel.dataChannel], channel.samples);
    displacement[idx].rawZerod = displacement[idx].rawValue - displacement[idx].rawZero;
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
    displacement[idx].primary = channel.primary;
    displacement[idx].unit = channel.unit;
  });
  limitChannels.forEach((channel, idx) => {
    limit[idx].active = dataIn[channel.dataChannel] === channel.active;
    limit[idx].unit = channel.unit;
  });
}

function createUiData() {
  let uiLoad = [];
  let uiDisplacement = [];
  load.forEach(l => {
    uiLoad.push({
      realValue: l.realValue,
      realZerod: l.realZerod,
      unit: l.unit,
      primary: l.primary
    });
  });
  displacement.forEach(d => {
    uiDisplacement.push({
      realValue: d.realValue,
      realZerod: d.realZerod,
      unit: d.unit,
      primary: d.primary
    });
  });
  return {
    uiLoad,
    uiDisplacement,
    uiLimit: limit,
    uiState: state,
    connected: connected
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
    port.flush(() => {
      port.close(() => {
        openPort();
      });
    });
  });

  ipcMain.on('reset-test-utilities', () => {
    resetTestUtilities();
  });

  ipcMain.on('tests-get', event => {
    event.sender.send('tests-reply', configuration.tests);
  });

  ipcMain.on('test-types-get', event => {
    event.sender.send('test-types-reply', configuration.testTypes);
  });

  ipcMain.on('test-set', (event, arg) => {
    testData = arg;
    event.sender.send('test-set-reply');
  });

  ipcMain.on('state-set', (event, arg) => {
    state = arg;
  });
  initialize();
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

// ******************************* TEST FUNCTIONS ************************************************************ //
function resetTestUtilities() {
  currentCycleLimit = null;
  currentCycleState = null;
  cycleCounter = null;
  cycleTimer.stop();
  cycleTimer.reset();
  idle();
  state = {
    state: 'MANUAL',
    subState: 'IDLE'
  };
}
// ******************************* TEST FUNCTIONS END ************************************************************ //

// ******************************* DATA FUNCTIONS ************************************************************ //
function getPrimaryLoad() {
  let primaryLoad;
  load.forEach(l => {
    if (l.primary) primaryLoad = l.realZerod;
  });
  return primaryLoad;
}

function zeroLoad() {
  load.forEach((l, idx) => {
    load[idx].rawZero = load[idx].rawValue;
  });
}

function zeroDisplacement() {
  displacement.forEach((l, idx) => {
    displacement[idx].rawZero = displacement[idx].rawValue;
  });
}
// ******************************* DATA FUNCTIONS END ************************************************************ //

// ******************************* MACHINE FUNCTIONS ********************************************************* //
function idle() {
  directionChannels.forEach(channel => {
    dataOut[channel.dataChannel] = channel.idleValue;
    dataOut[motorChannels[channel.motorChannel].dataChannel] = 0;
  });
}
function manualAdvance() {
  directionChannels.forEach(channel => {
    dataOut[channel.dataChannel] = channel.advanceValue;
    dataOut[motorChannels[channel.motorChannel].dataChannel] = motorChannels[channel.motorChannel].manual;
  });
}
function manualReverse() {
  directionChannels.forEach(channel => {
    dataOut[channel.dataChannel] = channel.reverseValue;
    dataOut[motorChannels[channel.motorChannel].dataChannel] = motorChannels[channel.motorChannel].manual;
  });
}
function testAdvance() {
  directionChannels.forEach(channel => {
    dataOut[channel.dataChannel] = channel.advanceValue;
    dataOut[motorChannels[channel.motorChannel].dataChannel] = testData.advanceSpeed;
  });
}
function idleValves() {
  directionChannels.forEach(channel => {
    dataOut[channel.dataChannel] = channel.idleValue;
  });
}
function applyLoad() {
  directionChannels.forEach(channel => {
    dataOut[channel.dataChannel] = channel.advanceValue;
    dataOut[motorChannels[channel.motorChannel].dataChannel] = testData.motorLoadSpeed;
  });
}
function removeLoad() {
  directionChannels.forEach(channel => {
    dataOut[channel.dataChannel] = channel.reverseValue;
    // dataOut[motorChannels[channel.motorChannel].dataChannel] = 0;
  });
}
// ******************************* MACHINE FUNCTIONS END ***************************************************** //

function processState() {
  if (state.state !== 'MANUAL') {
    console.log(state, `${dataOut.pwm0} ${dataOut.r0} ${dataOut.r1} ${dataOut.r2} ${dataOut.r3}`, cycleCounter, cycleTimer.read() / 1000);
  }
  switch (state.state) {
    case 'MANUAL':
      manual();
      break;
    case 'DYNAMIC_CREEP':
      dynamicCreep();
      break;
    default:
      break;
  }
}

// ******************************* STATE FUNCTIONS *********************************************************** //
function manual() {
  switch (state.subState) {
    case 'IDLE':
      idle();
      break;
    case 'ADVANCE':
      manualAdvance();
      break;
    case 'REVERSE':
      manualReverse();
      break;
  }
}
function dynamicCreep() {
  switch (state.subState) {
    case 'ZERO_LOAD':
      zeroLoad();
      state.subState = 'ADVANCE';
      break;
    case 'ADVANCE':
      testAdvance();
      state.subState = 'DETECT_LOAD';
      break;
    case 'DETECT_LOAD':
      if (getPrimaryLoad() > testData.loadDetectRealValue) state.subState = 'ZERO_DISPLACEMENT';
      break;
    case 'ZERO_DISPLACEMENT':
      zeroDisplacement();
      state.subState = 'INITIALIZE';
      break;
    case 'INITIALIZE':
      cycleCounter = 0;
      currentCycleState = 'CONDITIONING_CYCLES';
      currentCycleLimit = testData.conditioningCycles;
      endOfApplyLoadCycle = testData.cycleTime / 2;
      state.subState = 'APPLY_LOAD';
      cycleTimer.reset();
      cycleTimer.start();
      break;
    case 'APPLY_LOAD':
      applyLoad();
      state.subState = 'LOAD_CYCLE';
      break;
    case 'LOAD_CYCLE':
      if (cycleTimer.read() / 1000 > endOfApplyLoadCycle) {
        endOfRemoveLoadCycle = endOfApplyLoadCycle + testData.cycleTime / 2;
        state.subState = 'REMOVE_LOAD';
      }
      if (getPrimaryLoad() > testData.load) {
        idleValves();
      }
      break;
    case 'REMOVE_LOAD':
      removeLoad();
      state.subState = 'NO_LOAD_CYCLE';
      break;
    case 'NO_LOAD_CYCLE':
      if (cycleTimer.read() / 1000 > endOfRemoveLoadCycle) {
        cycleCounter += 1;
        state.subState = 'CHECK_END';
      }
      break;
    case 'CHECK_END':
      if (cycleCounter > currentCycleLimit) {
        if (currentCycleState === 'CONDITIONING_CYCLES') {
          cycleCounter = 0;
          currentCycleState = 'TEST_CYCLES';
          currentCycleLimit = testData.cycles;
          endOfApplyLoadCycle = endOfRemoveLoadCycle + testData.cycleTime / 2;
          state.subState = 'APPLY_LOAD';
        } else if (currentCycleState === 'TEST_CYCLES') {
          cycleTimer.stop();
          state.subState = 'DONE';
        }
      } else {
        endOfApplyLoadCycle = endOfRemoveLoadCycle + testData.cycleTime / 2;
        state.subState = 'APPLY_LOAD';
      }
      break;
    case 'DONE':
      idle();
      state = {
        state: 'MANUAL',
        subState: 'IDLE'
      };
      break;
    default:
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
