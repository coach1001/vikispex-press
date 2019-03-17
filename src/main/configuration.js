export default {
  machineSettings: {
    type: 'Dynamic Creep',
    load: {
      unit: 'kN',
      channels: [
        {
          unit: 'kN',
          type: 'input',
          dataChannel: 'adc0',
          mainChannel: true,
          coff: [0.001, 0.01, 0.1, 1],
          calc:
            'calc.adc0*calc.adc0*calc.adc0*calc.coff[0]+calc.adc0*calc.adc0*calc.coff[1]+calc.adc0*calc.coff[2]+calc.coff[3]',
          realMin: -5,
          realMax: 160
        }
      ]
    }
    /* displacement: {
      channels: [
        {
          type: 'input',
          unit: 'mm',
          dataChannel: 'adc2',
          dataMin: 5,
          dataMax: 10000,
          mainChannel: true,
          length: 50,
          calc: '(adc2/(dataMax-dataMin))*length',
          realMin: 5,
          realMax: 45
        }
      ]
    },
    limits: {
      channels: [
        {
          type: 'input',
          unit: 'integer',
          dataChannel: 'sw0',
          calc: 'sw0',
          realMax: 0
        },
        {
          type: 'input',
          unit: 'integer',
          dataChannel: 'sw0',
          calc: 'sw0',
          realMax: 0
        }
      ]
    },
    motor: {
      channels: [
        {
          type: 'output',
          unit: 'integer',
          dataChannel: 'pwm0',
          mainChannel: true,
          calc:
            'if(out+outMin > outMax) {out = outMax} else if(outMin+out < outMin) {out = outMin} else {out = out+outMin}',
          outMin: 600,
          outMax: 16000
        }
      ],
      manual: {
        channelValues: [1000]
      }
    },
    direction: {
      channels: [
        {
          type: 'output',
          unit: 'integer',
          dataChannel: 'r1',
          calc: 'out'
        },
        {
          type: 'output',
          unit: 'integer',
          dataChannel: 'r2',
          calc: 'out'
        }
      ],
      forward: {
        channelValues: [0, 1]
      },
      reverse: {
        channelValues: [1, 0]
      },
      neutral: {
        channelValues: [0, 0]
      }
    } */
  }
}
