<template>
  <div v-if="uiData" class="d-flex h-100 p-1">
    <div class="d-flex flex-row w-100">
      <div v-if="testParams" class="flex-1-2 p-1">
        <b-card border-variant="secondary" class="h-100 samples-card">
          <div class="row h-5 headers">
            <div :key="idx" v-for="(header, idx) in testParams.sampleHeaders" :class="columnClass(header)">{{header.name}}</div>    
          </div>
          <div id="samples" v-if="uiData.uiTestData" class="list">
            <div :key="lidx" v-for="(sample, lidx) in uiData.uiTestData.uiTestSamples" class="row">
              <div :key="idx" v-for="(header, idx) in testParams.sampleHeaders" :class="columnClassRow(header)">
                {{sample[idx]}}                
              </div>
            </div>
          </div>          
        </b-card>
      </div>
      <div class="d-flex flex-column flex-1 p-1">        
        <b-card border-variant="secondary" class="flex-4 mb-1">Graph</b-card>
        <div class="d-flex flex-row flex-6 mt-1">
          <b-card border-variant="secondary" class="flex-1">
            <b-form-group label="Test State" label-for="testState">
              <b-form-input id="testState" v-model="uiData.uiTestData.testState" type="text" readonly></b-form-input>
            </b-form-group>
            <b-row>
              <b-col>
                <b-form-group label="Elapsed Time" label-for="elapsedTime">
                  <b-form-input id="elapsedTime" v-model="uiData.uiTestData.elapsedTime" type="text" readonly></b-form-input>
                </b-form-group>
              </b-col>                
              <b-col v-if="testType.name === 'DYNAMIC_CREEP'">
                <b-form-group label="Cycles" label-for="cycles">
                  <b-form-input id="cycles" v-model="uiData.uiTestData.cycles" type="text" readonly></b-form-input>
                </b-form-group>
              </b-col> 
              <b-col v-if="testType.name !== 'DYNAMIC_CREEP'">
                <b-form-group label="Pacing Error" label-for="pacingError">
                  <b-form-input id="pacingError" v-model="uiData.uiTestData.pacingError" type="text" readonly></b-form-input>
                </b-form-group>
              </b-col>                
            </b-row>
            <b-row>
              <b-col>
                <b-form-group label="Load" label-for="load">
                  <b-form-input id="load" v-model="loadDisplay" type="text" readonly></b-form-input>
                </b-form-group>
              </b-col>                
              <b-col>
                <b-form-group label="Displacement" label-for="displacement">
                  <b-form-input id="displacement" v-model="displacementDisplay" type="text" readonly></b-form-input>
                </b-form-group>
              </b-col>                
            </b-row>
            <b-row>
              <b-col>
                <b-button block variant="outline-secondary" @click="backToTest">End Test</b-button>    
              </b-col>
              <b-col>
                <b-button block variant="outline-secondary" @click="backToTest">Emergency Stop</b-button>    
              </b-col>            
            </b-row>
          </b-card>
        </div>        
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { ipcRenderer } from 'electron';

export default {
  name: 'run-test',
  data() {
    return {
      sampleCount: 0
    }
  },
  computed: {
    ...mapGetters({
      testParams: 'GET_SELECTED_TEST_PARAMS',
      testType: 'GET_SELECTED_TEST_TYPE',
      uiData: 'GET_UI_DATA'
    }),
    displacementDisplay() {
      if (this.uiData.uiDisplacement) {
        let disp = ''
        this.uiData.uiDisplacement.forEach((ch) => {
          disp += `${ch.realZerod} ${ch.unit} `
        });
        return disp
      } else {
        return ''
      }
    },
    loadDisplay() {
      if (this.uiData.uiDisplacement) {
        let load = ''
        this.uiData.uiLoad.forEach((ch) => {
          load += `${ch.realZerod} ${ch.unit} `
        });
        return load
      } else {
        return ''
      }
    }
  },
  updated() {
    if (this.uiData) {
      if (this.uiData.uiTestData && this.uiData.uiTestData.uiTestSamples && this.uiData.uiTestData.uiTestSamples.length > this.sampleCount) {
        this.scroll();
        this.sampleCount = this.uiData.uiTestData.uiTestSamples.length;
      }
    }
  },
  mounted() {
    if (this.testParams && this.testType) {
      ipcRenderer.send('test-set', this.testParams);
      ipcRenderer.on('test-set-reply', (event, arg) => {
        ipcRenderer.send('state-set', this.testType.initialState)
      })
    } else {
      this.killTest();
      this.$router.push('/test-select')
    }
  },
  methods: {
    scroll() {
      document.getElementById('samples').scrollTop = document.getElementById('samples').scrollHeight
    },
    columnClass(header) {
      return `col-${header.span} sample-header`
    },
    columnClassRow(header) {
      return `col-${header.span} sample-row`
    },
    backToTest() {
      this.killTest()
      this.$router.push('/test-select')
    },
    killTest() {
      ipcRenderer.send('state-set', {
        state: 'MANUAL',
        subState: 'IDLE'
      })
      ipcRenderer.send('reset-test-utilities')
    }
  }
}
</script>

<style scoped>
.flex-1 {
  flex: 1;
}
.flex-1-2 {
  flex: 1.2;
}
.flex-4 {
  flex: 4;
}
.flex-6 {
  flex: 6;
}
.list {
  height: 94.5% !important;
  overflow-y: scroll;
  overflow-x: hidden;
  text-align: center;
}
.card-body {
  height: 95% !important;  
}
.sample-header {
  border-bottom: 1px solid #6c757d ;
}
.sample-row {
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
}
.samples-card > .card-body {
  padding: 0px;
}
.samples-card > .card-body > .row {
  margin-left: 0;
  margin-right: 0;
}
.headers .row {
  margin-left: 0;
  align-items: center;
}
.headers > div {
  padding-left: 0;
  padding-right: 0;
  text-align: center;
  padding-right: 16px;
}
.headers {
  align-items: center;
}
</style>
