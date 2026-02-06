/* global axios */

const EVOLUTION_API_BASE_URL = 'http://localhost:8080';
const EVOLUTION_API_KEY = '4GFRr4Sa57scLSatTYKKiCGbf3Tf4k7G';

class EvolutionChannel {
  constructor() {
    this.baseUrl = EVOLUTION_API_BASE_URL;
    this.apiKey = EVOLUTION_API_KEY;
  }

  getHeaders() {
    return {
      apikey: this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  async createInstance(instanceName, webhookUrl) {
    const response = await axios.post(
      `${this.baseUrl}/instance/create`,
      {
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        webhook: {
          url: webhookUrl,
          byEvents: false,
          base64: true,
          events: [
            'QRCODE_UPDATED',
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'MESSAGES_DELETE',
            'SEND_MESSAGE',
            'CONNECTION_UPDATE',
          ],
        },
      },
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async getQRCode(instanceName) {
    const response = await axios.get(
      `${this.baseUrl}/instance/connect/${instanceName}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async getConnectionStatus(instanceName) {
    const response = await axios.get(
      `${this.baseUrl}/instance/connectionState/${instanceName}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async fetchInstances() {
    const response = await axios.get(
      `${this.baseUrl}/instance/fetchInstances`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async deleteInstance(instanceName) {
    const response = await axios.delete(
      `${this.baseUrl}/instance/delete/${instanceName}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async restartInstance(instanceName) {
    const response = await axios.post(
      `${this.baseUrl}/instance/restart/${instanceName}`,
      {},
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async logoutInstance(instanceName) {
    const response = await axios.delete(
      `${this.baseUrl}/instance/logout/${instanceName}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }
}

export default new EvolutionChannel();
