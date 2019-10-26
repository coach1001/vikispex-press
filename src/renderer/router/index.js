import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'main-menu',
      component: require('@/components/MainMenu').default
    },
    {
      path: '/test-select',
      name: 'test-select',
      component: require('@/components/TestSelect').default
    },
    {
      path: '/run-test',
      name: 'run-test',
      component: require('@/components/RunTest').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
});
