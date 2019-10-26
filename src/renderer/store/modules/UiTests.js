const state = {
  uiTests: [],
  currentValues: {},
  selectedTestId: 1,
  selectedTestParams: {},
  testTypes: [],
  selectedTestType: {}
};

const getters = {
  GET_UI_TESTS: state => state.uiTests,
  GET_SELECTED_TEST_ID: state => state.selectedTestId,
  GET_CURRENT_VALUES: state => state.currentValues,
  GET_SELECTED_TEST: state => state.uiTests.find(val => val.id === state.selectedTestId),
  GET_SELECTED_TEST_PARAMS: state => state.selectedTestParams,
  GET_TEST_TYPES: state => state.testTypes,
  GET_SELECTED_TEST_TYPE: state => state.selectedTestType
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
  },
  SET_SELECTED_TEST_PARAMS(state, val) {
    state.selectedTestParams = val;
  },
  SET_TEST_TYPES(state, val) {
    state.testTypes = val;
  },
  SET_SELECTED_TEST_TYPE(state, val) {
    state.selectedTestType = state.testTypes.find(testType => testType.name === val);
  }
};

export default {
  state,
  mutations,
  getters
};
