import Vue from 'vue';
import axios from 'axios';
import BootstrapVue from 'bootstrap-vue';
import VeeValidate from 'vee-validate';
import vSelect from 'vue-select';
import App from './App';
import router from './router';
import store from './store';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import '@/assets/styles.css';
import { fieldUtils, objectUtils } from './utilities/Utilities';
import { VueMaskDirective } from 'v-mask';

Vue.use(BootstrapVue);
Vue.use(VeeValidate, {
  inject: true,
  fieldsBagName: '$veeFields'
});

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;
Vue.component('v-select', vSelect);
Vue.directive('mask', VueMaskDirective);
Vue.prototype.$fieldUtils = fieldUtils;
Vue.prototype.$objectUtils = objectUtils;

/* eslint-disable no-extend-native */
String.prototype.toProperCase = function() {
  return this.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app');
