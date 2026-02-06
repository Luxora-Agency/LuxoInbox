/* global axios */
import ApiClient from '../ApiClient';

class EvolutionChannel extends ApiClient {
  constructor() {
    super('evolution', { accountScoped: true });
  }

  createInstance(instanceName) {
    return axios.post(`${this.baseUrl()}/evolution/create_instance`, {
      instance_name: instanceName,
    });
  }

  getQRCode(instanceName) {
    return axios.get(`${this.baseUrl()}/evolution/connect/${instanceName}`);
  }

  getConnectionStatus(instanceName) {
    return axios.get(
      `${this.baseUrl()}/evolution/connection_state/${instanceName}`
    );
  }

  deleteInstance(instanceName) {
    return axios.delete(`${this.baseUrl()}/evolution/delete/${instanceName}`);
  }
}

export default new EvolutionChannel();
