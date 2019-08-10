const state = {
  uiData: {},
  connected: false
};

const getters = {
  GET_UI_DATA: state => state.uiData,
  GET_CONNECTED: state => state.connected
};

const mutations = {
  SET_UI_DATA(state, val) {
    state.uiData = val;
  },
  SET_CONNECTED(state, val) {
    state.connected = val;
  }
};

export default {
  state,
  mutations,
  getters
};
