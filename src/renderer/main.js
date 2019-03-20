import Vue from 'vue';
import axios from 'axios';
import BootstrapVue from 'bootstrap-vue';
import VeeValidate from 'vee-validate';
import App from './App';
import router from './router';
import store from './store';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import '@/assets/styles.css';

Vue.use(BootstrapVue);
Vue.use(VeeValidate, {
  inject: true,
  fieldsBagName: '$veeFields'
});

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app');
