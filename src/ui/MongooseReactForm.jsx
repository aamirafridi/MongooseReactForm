import React, { PropTypes, Component } from 'react';
import cloneDeep from 'lodash/lang/cloneDeep';

export class MongooseReactForm extends Component {
  static propTypes = {
    schema: PropTypes.object.isRequired,
    errors: PropTypes.object,
  };

  constructor(props, context) {
    super(props, context);
  }

  state = {
    validators: [],
    inputs: [],
    value: {},
  };

  componentWillMount() {
    this.state.errors = this.props.errors;
  }

  componentDidMount() {
    this.state.validators.map((validator) => {
      const key = Object.keys(validator)[0];
      const validators = validator[key];
      validators.validators && validators.validators.map((validator) => {
        validator.validator = this.stringToFunction(validator.validator);
      });
      const validateAll = function() {
        const value = this.value;
        const errors = [];
        // validate required
        if (validators.required) {
          if (value.trim().length === 0 || (this.type === 'checkbox' && !this.checked)) {
            errors.push(validators.required.replace(/{VALUE}/g, value));
          }
          if (value.trim().length !== 0 && this.type === 'number' && isNaN(Number(value))) {
            errors.push('Please provide a numeric value');
          }
        }
        // If not required, than validate only if user provides data
        if (validators.required || (!validators.required && value.trim().length > 0)) {
          // validate all validators
          validators.validators && validators.validators.map((validator) => {
            if (!validator.validator(value)) {
              errors.push(validator.message.replace(/{VALUE}/g, value));
            }
          });
          // value is provided. Check numeric value
          if (this.type === 'number' && isNaN(Number(value))) {
            errors.push('Please providate a numeric value');
          }
        }
        return errors.length === 0 ? false : errors;
      }
      this.refs[key].validate = validateAll;
    });
    window.refs = this.refs;
    window.state = this.state;
  }

  getInputs() {
    return this.state.inputs;
  }

  validate() {
    let allValid = true;
    const stateUpdates = {
      inputs: [],
      validators: [],
    };
    for (const ref in this.refs) {
      const input = this.refs[ref];
      const errors = input.validate();
      if (errors) {
        allValid = false;
        stateUpdates[`${ref}Error`] = errors;
      } else {
        stateUpdates[`${ref}Error`] = false;
      }
    }
    this.setState(stateUpdates);
    if (allValid) {
      return this.generateFormData();
    }
    return allValid;
  }

  stringToFunction(validator) {
    if (!validator) {
      return validator;
    }
    return new Function('return ' + validator)();
  }

  generateFormData() {
    const formData = {};
    let inputKey = 0;
    const recurse = (stateValue, formDataValue) => {
      for (const key in stateValue) {
        if (stateValue.hasOwnProperty(key)) {

          const value = stateValue[key];
          const valueIsArray = value.type.constructor === Array;
          const isRequired = Boolean(value.required);

          if (!value.type || (value.type && value.type.constructor === Object)) {
            console.log('recurse for', value);
            const formDataObj = {};
            formDataValue[key] = formDataObj;
            recurse(value, formDataObj);
            continue;
          }
          inputKey = inputKey + 1;
          const ref = `mrfInput${inputKey}`;
          const input = this.refs[ref];
          let inputValue = input.value;
          let type = valueIsArray ? value.type[0].trim() : value.type.trim();

          // for select dropdown with multiple means enum with type [string/number]
          if (input.multiple && input.options) {
            inputValue = [];
            for (let i = 0; i < input.options.length; i++) {
              const option = input.options[i];
              if (option.selected && option.value.trim().length > 0) {
                let optionValue = option.value;
                // if type is number than convert the value into number
                if (type === 'number' && !isNaN(Number(optionValue))) {
                  optionValue = Number(optionValue);
                }
                inputValue.push(optionValue);
              }
            }
          } else if (type === 'boolean') {
            inputValue = Boolean(input.checked);
          } else if (type === 'number') {
            inputValue = isNaN(Number(inputValue)) ? '' : Number(inputValue);
          }

          if (value.required || (Array.isArray(inputValue) && inputValue.length > 0) || (typeof inputValue === 'string' && inputValue.length > 0) || (type === 'number' && inputValue !== '')) {
            formDataValue[key] = (valueIsArray && !Array.isArray(inputValue)) ? [inputValue] : inputValue;
          }
        }
      }
    }
    recurse(this.state.value, formData);
    return formData;
  }

  generateInputs() {
    let inputKey = 0;
    const recurse = (obj, state) => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          const isRequired = Boolean(value.required);
          const isMultiple = Array.isArray(value.type);

          if (value.input === false || value.type === 'buffer') {
            continue;
          }

          if (isObjNeedsRecursion(value)) {
            const stateValue = {};
            state[key] = stateValue;
            recurse(value, stateValue);
            continue;
          }

          // construct state, to be used in updating
          state[key] = {
            type: value.type,
            required: isRequired,
          }

          inputKey = inputKey + 1;
          const multipleMessage = isMultiple ? <i>(Press cmd/ctrl and click to select multiple values)</i> : false;
          const requiredLabel = isRequired ? <i>(required)</i> : null;
          const groupKey = `mrf-group-${inputKey}`;
          const ref = `mrfInput${inputKey}`;
          const label = value.label || humanizeCamelcase(key);
          const max = value.max || false;
          const min = value.min || false;
          const maxlength = value.maxlength || false;
          let errors = this.state[`${ref}Error`] || false;

          if (!errors) {
            errors = this.state.errors[key] ? [this.state.errors[key]] : false; // string to array so we can join below while displaying
          }

          if (errors) {
            errors = (
              <div
                className="text-danger"
                dangerouslySetInnerHTML={{__html: `<li style="font-weight: normal;">${errors.join('<li style="font-weight: normal;">')}`}}
                />
              );
          }

          let input = null;
          let type = null;
          type = isMultiple ? value.type[0] : value.type;
          type = (type === 'boolean') ? 'checkbox' : type;
          type = (type === 'number') ? 'number' : type;
          type = (value.input && value.input !== 'textarea') ? value.input : type;
          type = (key === 'email') ? 'email' : type;

          const validateObj = {};
          validateObj[ref] = {
            validators: value.validators || false,
            required: value.required || false,
          };
          this.state.validators.push(validateObj);

          if (value.enum) {
            const dropdownOptions = value.enum.map((option) => <option key={option} value={option}>{option}</option>);
            input = (
              <div className={errors ? 'has-error form-group' : 'form-group'} key={groupKey}>
                <label>
                  {label} {multipleMessage} {requiredLabel} {errors}
                </label>
                <select
                  defaultValue={isMultiple ? [] : ''}
                  multiple={isMultiple}
                  size={isMultiple ? value.enum.length + 1 : 0}
                  required={isRequired}
                  ref={ref}
                  name={key}
                  className="form-control">
                    <option value="" disabled>Select option...</option>
                    {dropdownOptions}
                </select>
              </div>
            );
          } else if (value.input === 'textarea') {
            input = (
              <div className={errors ? 'has-error form-group' : 'form-group'} key={groupKey}>
                <label className="control-label">
                  {label} {requiredLabel} {errors}
                </label>
                <textarea
                  required={isRequired}
                  ref={ref}
                  name={key}
                  maxLength={maxlength}
                  className="form-control"
                ></textarea>
              </div>
            );
          } else if (type === 'checkbox') {
            input = (
              <div className={errors ? 'has-error checkbox' : 'checkbox'} key={groupKey}>
                <label>
                  <input
                    required={isRequired}
                    ref={ref}
                    name={key}
                    type="checkbox"
                  />
                  {label} {requiredLabel} {errors}
                </label>
              </div>
            );
          } else {
            input = (
              <div className={errors ? 'has-error form-group' : 'form-group'} key={groupKey}>
                <label className="control-label">
                  {label} {requiredLabel} {errors}
                </label>
                <input
                  required={isRequired}
                  ref={ref}
                  name={key}
                  type={(!type || type === 'string') ? 'text' : type}
                  className="form-control"
                  max={max}
                  min={min}
                  maxLength={maxlength}
                />
              </div>
            );
          }
          this.state.inputs.push(input);
        }
      }
    };
    recurse(this.props.schema, this.state.value);
  }

  render() {
    this.state.inputs = [];
    this.generateInputs();
    return (<div>{this.state.inputs}</div>);
  }
}


function isObjNeedsRecursion(value) {
  return (Object === value.constructor && Object.keys(value).length !== 0) &&
    !Array.isArray(value) &&
    (!value.type || (value.type && value.type.type)); // .type.type means e.g. geo:{type:{type:'Point'}}
}

function capitalizeFirstLetter(str) {
  return str[0].toUpperCase() + str.slice(1);
}

function humanizeCamelcase(str) {
  return capitalizeFirstLetter(
    str.split(/(?=[A-Z])/).join(' ').toLowerCase()
  );
}


// should be a separate file may be
// scroll to the bottom for the starting point
export const mongooseSchemaConverter = ({ schema: { tree } }) => {
  if (!tree || Object !== tree.constructor) {
    return console.error('Please provide a valid mongoose Model'); // eslint-disable-line no-console
  }

  function typeToString(value) {
    const detectType = (val) => {
      const valStr = val.toString();
      if (valStr.indexOf('Mixed') !== -1) {
        return 'any';
      }
      if (valStr.indexOf('Buffer') !== -1) {
        return 'buffer';
      }
      if (valStr.indexOf('Date') !== -1) {
        return 'date';
      }
      if (valStr.indexOf('ObjectId') !== -1) {
        return 'objectId';
      }
      const typeofValue = typeof val();
      return Array.isArray(val) ? 'array' : typeofValue;
    };

    // this means that type is not wrapped in array i.e. [String]
    if (Function === value.constructor) {
      return detectType(value);
    }
    if (Array.isArray(value)) {
      // it is an emtpy array which means 'any'
      if (value.length === 0) return ['any'];
      return [detectType(value[0])];
    }
    // empty object which is for any time of data
    if (Object === value.constructor && Object.keys(value).length === 0) {
      return 'any';
    }
  }

  function makeValidationFunctionString(validator) {
    let result = validator;
    if (validator.indexOf('=>') !== -1) {
      const func = validator.split('=>');
      if (func[0].indexOf('(') === -1 || func[0].indexOf(')') === -1) {
        func[0] = `function (${func[0].trim()})`;
      }
      if (func[1].indexOf('return') === -1) {
        func[1] = `{ return ${func[1].trim()} }`;
      }
      result = `${func[0]} ${func[1].trim()}`.trim();
    }
    return result;
  }

  function validationMinMax(obj, key) {
    const constructValidation = (minField, maxField, min, max, minErr = null, maxErr = null) => {
      let minCond = '';
      let minMessage = '';
      let maxCond = '';
      let maxMessage = '';
      // console.log(minField, maxField, min, max)
      const humanizeKey = humanizeCamelcase(key).toLowerCase();
      if (min) {
        if (minField === 'minlength') {
          minCond = `String(value).length >= ${min}`;
          minMessage = `The length of ${humanizeKey} should be greater than ${min} character${min>1 ? 's' : ''}`;
        } else {
          minCond = `Number(value) >= ${min}`;
          minMessage = `The value of ${humanizeKey} should be greater than ${min}`;
        }
        if (minErr) {
          minMessage = minErr
            .replace('{PATH}', humanizeKey)
            .replace('{MIN}', min)
            .replace('{MINLENGTH}', min);
        }
      }
      if (max) {
        if (maxField === 'maxlength') {
          maxCond = `String(value).length <= ${max}`;
          maxMessage = `The length of ${humanizeKey} should be less than ${max} character${max>1 ? 's' : ''}`;
        } else {
          maxCond = `Number(value) <= ${max}`;
          maxMessage = `The value of ${humanizeKey} should be less than ${max}`;
        }
        if (maxErr) {
          maxMessage = maxErr
            .replace('{PATH}', humanizeKey)
            .replace('{MAX}', max)
            .replace('{MAXLENGTH}', max);
        }
      }
      let message = `${minMessage}${minMessage && maxMessage ? ' or ' : ''}${maxMessage}`.toLowerCase();
      message = message.replace(/{value}/g, '{VALUE}');
      message = capitalizeFirstLetter(message);
      return {
        validator: `function (value){ return ${minCond} ${minCond && maxCond ? '&&' : ''} ${maxCond} }`,
        message,
      };
    };

    let minField = null;
    if (obj[key].min) {
      minField = 'min';
    }
    if (obj[key].minlength) {
      minField = 'minlength';
    }
    let maxField = null;
    if (obj[key].max) {
      maxField = 'max';
    }
    if (obj[key].maxlength) {
      maxField = 'maxlength';
    }

    if (obj[key][minField] || obj[key][maxField]) {
      let min = false;
      let max = false;
      let minMessage = false;
      let maxMessage = false;

      if (obj[key][minField]) {
        if (obj[key][minField].constructor === Number) {
          min = obj[key][minField];
        }
        if (Array.isArray(obj[key][minField])) {
          min = obj[key][minField][0];
          minMessage = obj[key][minField][1];
        }
      }
      if (obj[key][maxField]) {
        if (obj[key][maxField].constructor === Number) {
          max = obj[key][maxField];
        }
        if (Array.isArray(obj[key][maxField])) {
          max = obj[key][maxField][0];
          maxMessage = obj[key][maxField][1];
        }
      }

      obj[key].validators.push(
        constructValidation(minField, maxField, min, max, minMessage, maxMessage)
      );

      if (maxField === 'maxlength') {
        obj[key].maxlength = max;
      }
      if (maxField === 'max') {
        obj[key].max = max;
      }
      if (minField === 'minlength') {
        obj[key].minlength = min;
      }
      if (minField === 'min') {
        obj[key].min = min;
      }
    }
  }

  function validationEnum(obj, key) {
    const enumVal = obj[key].enum;
    const validate = {
      validator: '',
      message: '',
    };
    const makeFunction = (list) => {
      return `function (value) { return ${JSON.stringify(list)}.indexOf(value) !== -1; }`;
    };
    let values = '';
    // enum as array
    // ['a', 'b']
    if (Array.isArray(enumVal)) {
      values = enumVal;
      validate.validator = makeFunction(enumVal);
      validate.message = 'Invalide value selected from the list provided';
    } else if (Object === enumVal.constructor && enumVal.values && enumVal.message) {
      // enum as object
      // { values: ['a', 'b'], message: 'enum validator failed for path `{PATH}` with value `{VALUE}`'}
      values = enumVal.values;
      validate.validator = makeFunction(enumVal.values);
      validate.message = enumVal.message.replace('{PATH}', humanizeCamelcase(key).toLowerCase());
    }
    obj[key].validators.push(validate);
    obj[key].enum = values;
  }

  function validationRegExp(obj, key) {
    let regExp = obj[key].match;
    regExp = Array.isArray(regExp) ? regExp[0] : regExp;
    if (RegExp !== regExp.constructor) {
      return; // its not a regex but some other sort of data
    }
    obj[key].validators.push({
      validator: `function (value){ return ${regExp}.test(value); }`,
      message: Array.isArray(regExp) ? regExp[1] : `Please provide a valid for ${humanizeCamelcase(key).toLowerCase()}`,
    });
    delete obj[key].match;
  }

  function validation(obj, key) {
    // change validate method to string
    if (Array.isArray(obj[key].validate)) {
      // convert validate array to object
      obj[key].validate = {
        validator: obj[key].validate[0],
        message: obj[key].validate[1],
      };
    } else { // is object, just change validator and leave message as it is
      if (obj[key].validate.validator) {
        obj[key].validate.validator = obj[key].validate.validator;
      }
    }
    obj[key].validate.validator = makeValidationFunctionString(obj[key].validate.validator.toString());
    obj[key].validators.push(obj[key].validate);
  }

  function required(obj, key) {
    if (!obj[key].required) return;
    // construct required message if boolean is provided and is true, otherwise leave default message
    if (typeof obj[key].required === 'boolean' || obj[key].required === true) {
      obj[key].required = `${humanizeCamelcase(key)} is required`;
    } else if (obj[key].required.constructor === String) {
      let msg = obj[key].required.replace('{PATH}', humanizeCamelcase(key));
      msg = msg.toLowerCase();
      msg = capitalizeFirstLetter(msg);
      obj[key].required = msg;
    }
  }

  function recurse(obj) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        // remove unwanted keys or if it has input=false
        if (key === '_id' || key === 'id' || key === '__v' || value.path) {
          delete obj[key];
          continue;
        }

        // if value is object (but not empty) and has no type than
        // send it to recurse - keep in mind type.type for geo data
        if (isObjNeedsRecursion(value)) {
          recurse(value);
          continue;
        }

        // required fields
        required(obj, key);

        // all validators
        obj[key].validators = [];

        // validation
        if (obj[key].validate) {
          validation(obj, key);
        }
        if (obj[key].max || obj[key].min || obj[key].maxlength || obj[key].minlength) {
          validationMinMax(obj, key);
        }
        if (obj[key].enum) {
          validationEnum(obj, key);
        }
        if (obj[key].match) {
          validationRegExp(obj, key);
        }

        // e.g. fullName: String,
        if (key !== 'type' && !value.type) {
          if (typeof value.constructor === String) {
            obj[key] = { type: value.toLowerCase() };
          } else {
            obj[key] = { type: typeToString(value) };
          }
        } else if (value.type) { // e.g fulName: {type:String}
          obj[key].type = typeToString(value.type);
        }
      }
    }
  }
  // don't change the original object
  const copyTree = cloneDeep(tree);
  // starting point
  recurse(copyTree);
  return copyTree;
};
