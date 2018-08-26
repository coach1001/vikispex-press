'use strict'

import { app, BrowserWindow, ipcMain } from 'electron'

const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const port = new SerialPort('COM2', { baudRate: 57600, autoOpen: false })
const parser = port.pipe(new Readline({ delimiter: '\n' }))
const crc16 = require('js-crc').crc16

let dataOut = {
  pwm0: 16000,
  pwm1: 1000,
  r0: 1,
  r1: 0,
  r2: 1,
  r3: 1,
  kS: 0
}

let dataIn = {
  adc0: 0,
  adc1: 0,
  sw0: 0,
  sw1: 0,
  sw2: 0
}

let rxTimeout
let sDataIn

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

function sendData () {
  let sOutDelimited =
    `${dataOut.pwm0.toString(16)} ` +
    `${dataOut.pwm1.toString(16)} ` +
    `${dataOut.r0.toString(16)} ` +
    `${dataOut.r1.toString(16)} ` +
    `${dataOut.r2.toString(16)} ` +
    `${dataOut.r3.toString(16)} ` +
    `${dataOut.kS.toString(16)} `
  let sOutNonDelimited =
    `${dataOut.pwm0.toString(16)}` +
    `${dataOut.pwm1.toString(16)}` +
    `${dataOut.r0.toString(16)}` +
    `${dataOut.r1.toString(16)}` +
    `${dataOut.r2.toString(16)}` +
    `${dataOut.r3.toString(16)}` +
    `${dataOut.kS.toString(16)}`
  sOutDelimited += `${crc16(sOutNonDelimited)}\n`
  port.write(sOutDelimited)

  rxTimeout = setTimeout(() => {
    sendData()
  }, 1000)
}

function checkCrc () {
  let crcString = ''

  for (let i = 0; i < sDataIn.length; i++) {
    if (i !== (sDataIn.length - 1)) {
      crcString += sDataIn[i]
    }
  }

  if (crc16(crcString) === sDataIn[sDataIn.length - 1]) {
    return true
  }

  return false
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  port.open((error) => {
    console.log(error)
    console.log('Serial Port Opened!...')

    ipcMain.on('data-get', (event, arg) => {
      event.sender.send('data-get-reply', dataIn)
    })
    /* ipcMain.on('data-send', (event, arg) => {
      dataOut = arg.dataOut
    }) */
    sendData()
  })

  parser.on('data', (data) => {
    clearTimeout(rxTimeout)
    sDataIn = data.split(' ')
    if (checkCrc()) {
      dataIn.adc0 = parseInt(sDataIn[0], 16)
      dataIn.adc1 = parseInt(sDataIn[1], 16)
      dataIn.sw0 = parseInt(sDataIn[2], 16)
      dataIn.sw1 = parseInt(sDataIn[3], 16)
      dataIn.sw2 = parseInt(sDataIn[4], 16)
    }
    sendData()
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    port.close((error) => {
      console.log(error)
      console.log('Serial Port Closed!...')
      app.quit()
    })
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

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
