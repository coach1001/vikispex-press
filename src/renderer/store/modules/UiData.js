const state = {
  uiData: {}
};

const getters = {
  GET_UI_DATA: state => state.uiData
};

const mutations = {
  SET_UI_DATA(state, val) {
    state.uiData = val;
  }
};

export default {
  state,
  mutations,
  getters
};
