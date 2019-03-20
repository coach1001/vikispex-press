const state = {
  uiTests: [],
  currentValues: {},
  selectedTestId: 1
};

const getters = {
  GET_UI_TESTS: state => state.uiTests,
  GET_SELECTED_TEST_ID: state => state.selectedTestId,
  GET_CURRENT_VALUES: state => state.currentValues,
  GET_SELECTED_TEST: state => state.uiTests.find(val => val.id === state.selectedTestId)
};

const mutations = {
  SET_UI_TESTS(state, val) {
    state.uiTests = val;
  },
  SET_CURRENT_VALUES(state, val) {
    state.currentValues = val;
  },
  SET_SELECTED_TEST(state, val) {
    state.selectedTestId = val;
  }
};

export default {
  state,
  mutations,
  getters
};
