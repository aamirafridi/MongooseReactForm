import mongoose from 'mongoose';

const validateEmail = (email) => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);

const Schema = mongoose.Schema;
const demoSchema = new Schema({
  email: {
    type: String,
    required: true,
    minlength: 10,
    validate: [validateEmail, 'Please provide a valid email'],
  },
  // termsAndConditions: {
  //   type: Boolean,
  //   required: 'You must agree to terms and conditions',
  // },
  // description: {
  //   type: String,
  //   maxlength: 1,
  //   input: 'textarea',
  //   label: 'Please enter in details:',
  // },
  // minMax: {
  //   type: [Number],
  //   min: 18,
  //   max: 65,
  // },
  // maxMinArr: {
  //   type: Number,
  //   min: [18, 'The value of {PATH} ({VALUE}) is less than the lower limit ({MIN})'],
  //   max: [65, 'The value of {PATH} ({VALUE}) exceeds the limit ({MAX})'],
  // },
  // maxx: {
  //   type: Number,
  //   max: 65,
  // },
  // minn: {
  //   type: Number,
  //   min: 65,
  // },
  // minMaxMix: {
  //   type: Number,
  //   min: [18, 'The value of {PATH} ({VALUE}) is less than the lower limit ({MIN})'],
  //   max: 65,
  // },
  // minMaxLength: {
  //   type: String,
  //   minlength: 18,
  //   maxlength: 65,
  // },
  // maxMinArrLength: {
  //   type: String,
  //   minlength: [18, 'The length of {PATH} ({VALUE}) is less than the lower limit ({MINLENGTH})'],
  //   maxlength: [65, 'The length of {PATH} ({VALUE}) exceeds the limit ({MAXLENGTH})'],
  // },
  // maxxLengthhhhhh: {
  //   type: String,
  //   maxlength: 65,
  // },
  // minnLength: {
  //   type: String,
  //   minlength: 65,
  // },
  // minMaxMixLength: {
  //   type: String,
  //   minlength: [18, 'The length of {PATH} ({VALUE}) is less than the lower limit ({MINLENGTH})'],
  //   maxlength: 65,
  // },
  // mixed: Schema.Types.Mixed,
  // someId: Schema.Types.ObjectId,
  // // array: [],
  // // someOBj: {},
  // ofString: [String],
  // ofNumber: [Number],
  // ofDates: [Date],
  // ofBuffer: [Buffer],
  // ofBoolean: [Boolean],
  // ofMixed: [Schema.Types.Mixed],
  // ofObjectId: [Schema.Types.ObjectId],
  // bigText: {
  //   type: String,
  //   input: 'textarea',
  // },
  // nested: {
  //   stuff: {
  //     type: String,
  //     lowercase: true,
  //     trim: true,
  //   },
  // },
  // city: {
  //   type: String,
  //   enum: ['peshawar', 'lahore', 'karachi'],
  // },
  // enumObj: {
  //   type: [String],
  //   enum: {
  //     values: ['multi-1', 'multi-2', 'multi-3'],
  //     message: 'enum validator failed for path {PATH} with value {VALUE}',
  //   },
  // },
  // createdDate: {
  //   input: false,
  //   type: Date,
  // },
  // matchSimple: {
  //   type: String,
  //   match: /^a/,
  // },
  // matchArray: {
  //   type: String,
  //   match: [ /\.html$/, "That file doesn't end in .html ({VALUE})"],
  // },
  // geo: {
  //   type: {
  //     type: String,
  //     default: 'Point',
  //   },
  //   coordinates: {
  //     type: [Number],
  //     required: 'Invalid address provided. Please type and then select from the list',
  //   },
  // },
});

export default mongoose.model('DemoModal', demoSchema);
