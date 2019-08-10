<template>
  <div class="d-flex h-100 p-1">
    <div class="d-flex flex-row w-100">
      <div class="flex-4 p-1">
        <b-card  class="h-100">Sampling Data</b-card>
      </div>
      <div class="d-flex flex-column flex-6 p-1">        
        <b-card class="flex-4 mb-1">Graph</b-card>
        <div class="d-flex flex-row flex-6 mt-1">
          <b-card class="flex-1">
            <b-form-group label="Test State" label-for="testState">
              <b-form-input id="testState" type="text" readonly></b-form-input>
            </b-form-group>
            <b-row>
              <b-col>
                <b-form-group label="Elapsed Time" label-for="elapsedTime">
                  <b-form-input id="elapsedTime" type="text" readonly></b-form-input>
                </b-form-group>
              </b-col>                
              <b-col>
                <b-form-group label="Cycles" label-for="cycles">
                  <b-form-input id="cycles" type="text" readonly></b-form-input>
                </b-form-group>
              </b-col>                
            </b-row>
            <b-row>
              <b-col>
                <b-form-group label="Load" label-for="load">
                  <b-form-input id="load" type="text" readonly></b-form-input>
                </b-form-group>
              </b-col>                
              <b-col>
                <b-form-group label="Displacement" label-for="displacement">
                  <b-form-input id="displacement" type="text" readonly></b-form-input>
                </b-form-group>
              </b-col>                
            </b-row>
            <b-row>
              <b-col>
                <b-button block variant="outline-success" @click="backToTest">End Test</b-button>    
              </b-col>
              <b-col>
                <b-button block variant="danger" @click="backToTest">Emergency Stop</b-button>    
              </b-col>            
            </b-row>
          </b-card>
        </div>        
      </div>
    </div>
  </div>
    <!-- <b-row>
      <b-col block>
        <b-button block variant="outline-secondary" @click="backToTest">Back to Test Select</b-button>
      </b-col>
    </b-row> -->

</template>

<script>
import { mapGetters } from 'vuex';
import { ipcRenderer } from 'electron';

export default {
  name: 'run-test',
  computed: {
    ...mapGetters({
      testParams: 'GET_SELECTED_TEST_PARAMS',
      testType: 'GET_SELECTED_TEST_TYPE'
    })
  },
  mounted() {
    if (this.testParams && this.testType) {
      ipcRenderer.send('test-set', this.testParams);
      ipcRenderer.on('test-set-reply', (event, arg) => {
        ipcRenderer.send('state-set', this.testType.initialState);
      });
    } else {
      this.killTest();
      this.$router.push('/test-select');
    }
  },
  methods: {
    backToTest() {
      this.killTest();
      this.$router.push('/test-select');
    },
    killTest() {
      ipcRenderer.send('state-set', {
        state: 'MANUAL',
        subState: 'IDLE'
      });
      ipcRenderer.send('reset-test-utilities');
    }
  }
}
</script>

<style scoped>
.flex-1 {
  flex: 1;
}
.flex-4 {
  flex: 4;
}
.flex-6 {
  flex: 6;
}
</style>
