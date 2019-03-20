'use strict';

import { app, BrowserWindow, ipcMain } from 'electron';
import Config from './configuration';
import CircularBuffer from 'circular-buffer';

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
// 9600, 14400, 19200, 38400, 57600, 115200
const port = new SerialPort(Config.machineSettings.commPort, { baudRate: Config.machineSettings.baudRate, autoOpen: false });
const parser = port.pipe(new Readline({ delimiter: '\n' }));
const crc16 = require('js-crc').crc16;

let load = [];
let displacement = [];

Config.machineSettings.load.channels.forEach(channel => {
  let loadChannel = {
    buffer: new CircularBuffer(channel.samples),
    realValue: null,
    samples: channel.samples
  };
  load.push(loadChannel);
});

Config.machineSettings.displacement.channels.forEach(channel => {
  let displacementChannel = {
    buffer: new CircularBuffer(channel.samples),
    realValue: null,
    samples: channel.samples
  };
  displacement.push(displacementChannel);
});

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
  adc1: 0, // 32bit
  adc2: 0, // 16bit
  adc3: 0, // 16bit
  sw0: 0, // 0 or 1
  sw1: 0 // 0 or 1
};
let rxTimeout;
let sDataIn;
let connectionLost = false;

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path')
    .join(__dirname, '/static')
    .replace(/\\/g, '\\\\');
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
  port.write(sOutDelimited);

  rxTimeout = setTimeout(() => {
    connectionLost = true;
  }, 5000);
}

function checkCrc() {
  let crcString = '';
  for (let i = 0; i < sDataIn.length; i++) {
    if (i !== sDataIn.length - 1) {
      crcString += sDataIn[i];
    }
  }
  if (crc16(crcString) === sDataIn[sDataIn.length - 1]) {
    return true;
  }
  return false;
}

let mainWindow;
const winURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`;

function openPort() {
  port.open(error => {
    console.log(error);
    console.log('Serial Port Opened!...');
    sendData();
  });
}

function parseData() {
  Config.machineSettings.load.channels.forEach((channel, idx) => {
    let calc = { ...channel };
    let calcValue;
    calc.coff = channel.coff;
    calc[channel.dataChannel] = dataIn[channel.dataChannel];
    // eslint-disable-next-line no-eval
    calcValue = eval(channel.calc);
    load[idx].buffer.enq(calcValue);
    load[idx].realValue = load[idx].buffer
      .toarray()
      .map((c, i, arr) => c / arr.length)
      .reduce((p, c) => c + p);
    load[idx].mainChannel = channel.mainChannel;
    load[idx].realValue = load[idx].realValue.toFixed(channel.realValuePrecision);
    load[idx].displayValue = `${load[idx].realValue} ${channel.unit}`;
  });
  Config.machineSettings.displacement.channels.forEach((channel, idx) => {
    let calc = { ...channel };
    let calcValue;
    calc.coff = channel.coff;
    calc[channel.dataChannel] = dataIn[channel.dataChannel];
    // eslint-disable-next-line no-eval
    calcValue = eval(channel.calc);
    displacement[idx].buffer.enq(calcValue);
    displacement[idx].realValue = displacement[idx].buffer
      .toarray()
      .map((c, i, arr) => c / arr.length)
      .reduce((p, c) => c + p);
    displacement[idx].mainChannel = channel.mainChannel;
    displacement[idx].realValue = displacement[idx].realValue.toFixed(channel.realValuePrecision);
    displacement[idx].displayValue = `${displacement[idx].realValue} ${channel.unit}`;
  });
}

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 768,
    useContentSize: true,
    width: 1024
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
    if (connectionLost) {
      connectionLost = false;
      event.sender.send('connection-lost');
    } else {
      let uiData = {
        load: [],
        displacement: []
      };
      load.forEach(val => {
        uiData.load.push({
          displayValue: val.displayValue,
          mainChannel: val.mainChannel
        });
      });
      displacement.forEach(val => {
        uiData.displacement.push({
          displayValue: val.displayValue,
          mainChannel: val.mainChannel
        });
      });
      event.sender.send('data-get-reply', uiData);
    }
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
    event.sender.send('tests-data-reply', Config.tests);
  });

  parser.on('data', data => {
    clearTimeout(rxTimeout);
    sDataIn = data.split(' ');
    if (checkCrc()) {
      dataIn.adc0 = parseInt(sDataIn[0], 16);
      dataIn.adc1 = parseInt(sDataIn[1], 16);
      dataIn.adc2 = parseInt(sDataIn[2], 16);
      dataIn.adc3 = parseInt(sDataIn[3], 16);
      dataIn.sw0 = parseInt(sDataIn[4], 16);
      dataIn.sw1 = parseInt(sDataIn[5], 16);
    }
    sendData();
    parseData();
  });

  openPort();
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
