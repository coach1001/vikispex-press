const fieldUtils = {
  parentName(name) {
    if (name !== undefined) {
      return `${name}_`;
    } else {
      return '';
    }
  },
  removeEmpty(obj) {
    Object.keys(obj).forEach((key, index) => {
      if (obj[key] && typeof obj[key] === 'object' && objectUtils.isEmpty(obj[key])) {
        if (Array.isArray(obj)) {
          obj.splice(index, 1);
        } else {
          delete obj[key];
        }
      } else if (obj[key] && typeof obj[key] === 'object') {
        this.removeEmpty(obj[key]);
      } else if (obj[key] && Array.isArray(obj[key]) && obj[key].length < 1) {
        delete obj[key];
      } else if (obj[key] === undefined) {
        delete obj[key];
      }
    });
    return obj;
  },
  getInputClass(fieldType, full) {
    if (full) {
      return 'col-12';
    } else if (fieldType === 'ArrayInput' || fieldType === 'ObjectInput' || fieldType === 'ModalInput') {
      return 'col-12';
    } else {
      return 'col-12 col-sm-12 col-md-6 col-lg-6 col-xl-6';
    }
  },
  checkErrors(field, errors, $veeFields) {
    if ($veeFields[field] !== undefined) {
      return !errors.has(field) ? null : false;
    }
    return null;
  },
  markAllFiedsAsDirty($veeFields) {
    if (!objectUtils.isEmpty($veeFields)) {
      for (var key in $veeFields) {
        $veeFields[key].dirty = true;
      }
    }
  },
  isVisible(data, property, value) {
    if (property) {
      if (value) {
        for (let i = 0; i < value.length; i++) {
          if (data[property] === value[i]) {
            return true;
          }
        }
      } else {
        if (data[property]) {
          return true;
        }
      }
      return false;
    }
    return true;
  },
  isEnabled(data, property, value) {
    if (property) {
      if (value) {
        for (let i = 0; i < value.length; i++) {
          if (data[property] === value[i]) {
            return false;
          }
        }
      } else {
        if (data[property]) {
          return false;
        }
      }
      return true;
    }
    return false;
  },
  canClear(data, property, value) {
    if (property) {
      if (value) {
        for (let i = 0; i < value.length; i++) {
          if (data[property] === value[i]) {
            return false;
          }
        }
      } else {
        if (data[property]) {
          return false;
        }
      }
      return true;
    }
    return false;
  },
  addBottomMargin(currField, nextField) {
    if (nextField === undefined) {
      return false;
    } else {
      if (
        (currField.fieldType === 'ArrayInput' || currField.fieldType === 'ObjectInput') &&
        (nextField.fieldType !== 'ArrayInput' && nextField.fieldType !== 'ObjectInput')
      ) {
        return true;
      } else {
        return false;
      }
    }
  },
  checkForRequiredIds(requiredIds, currentIds) {
    const requiredIdcount = requiredIds.length;
    let count = 0;
    requiredIds.forEach(rId => {
      if (currentIds[rId]) {
        count += 1;
      }
    });
    if (requiredIdcount === count) {
      return true;
    } else {
      return false;
    }
  },
  checkDefaultValue(defaultValue, formValue) {
    if (formValue !== undefined) {
      return formValue;
    } else if (defaultValue !== undefined) {
      return defaultValue;
    }
    return null;
  }
};

const objectUtils = {
  isEmpty(obj) {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        return false;
      }
    }
    return true;
  },
  printJSON(obj) {
    return JSON.stringify(obj);
  }
};

export { fieldUtils, objectUtils };
