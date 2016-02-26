import React, { PropTypes, Component } from 'react';
import {MongooseReactForm} from './MongooseReactForm';
import reqwest from 'reqwest';

export default class DemoForm extends Component {
  static propTypes = {
    schema: PropTypes.object.isRequired,
    saveEndpoint: PropTypes.string.isRequired,
    success: PropTypes.string,
    errors: PropTypes.object,
  };

  constructor(props, context) {
    super(props, context);
    this.onSubmit = this.onSubmit.bind(this);
  }

  state = {};

  componentWillMount() {
    this.state.schema = this.props.schema;
    this.state.errors = this.props.errors;
    this.state.success = this.props.success;
  }

  onSubmit(e) {
    e.preventDefault();
    const result = this.refs.mrf.validate();
    if (!result) {
      return console.warn('Errors in form');
    }
    reqwest({
      method: 'POST',
      url: this.props.saveEndpoint,
      type: 'json',
      data: result,
    })
      .then(({message}) => this.setState({ errors: false, success: message}))
      .fail(({response}) => {
        const {message} = JSON.parse(response);
        this.setState({
          success: false,
          errors: message || 'Error while saving the form',
        });
      });
  }

  render() {
    if (this.state.success) {
      return (<div className="alert alert-success">{this.state.success}</div>);
    }
    return (
      <form action={this.props.saveEndpoint} method="post" noValidate onSubmit={this.onSubmit}>
        <MongooseReactForm key="mrf" ref="mrf" errors={this.state.errors} schema={this.state.schema} />
        <button type="submit" className="btn">Save</button>
      </form>
    );
  }
}
