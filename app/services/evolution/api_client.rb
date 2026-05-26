class Evolution::ApiClient
  REQUEST_TIMEOUT = 30

  def initialize
    @base_url = ENV.fetch('EVOLUTION_API_URL', 'http://localhost:8080')
    @api_key = ENV.fetch('EVOLUTION_API_KEY', '4GFRr4Sa57scLSatTYKKiCGbf3Tf4k7G')
  end

  def create_instance(instance_name:, webhook_url:)
    response = HTTParty.post(
      "#{@base_url}/instance/create",
      headers: headers,
      body: build_instance_payload(instance_name, webhook_url).to_json,
      **request_options
    )
    handle_response(response)
  end

  def get_qr_code(instance_name)
    response = HTTParty.get(
      "#{@base_url}/instance/connect/#{instance_name}",
      headers: headers,
      **request_options
    )
    handle_response(response)
  end

  def connection_state(instance_name)
    response = HTTParty.get(
      "#{@base_url}/instance/connectionState/#{instance_name}",
      headers: headers,
      **request_options
    )
    handle_response(response)
  end

  def delete_instance(instance_name)
    response = HTTParty.delete(
      "#{@base_url}/instance/delete/#{instance_name}",
      headers: headers,
      **request_options
    )
    handle_response(response)
  end

  def send_text(instance_name:, number:, text:)
    response = HTTParty.post(
      "#{@base_url}/message/sendText/#{instance_name}",
      headers: headers,
      body: { number: number, text: text }.to_json,
      **request_options
    )
    handle_response(response)
  end

  def send_media(params)
    response = HTTParty.post(
      "#{@base_url}/message/sendMedia/#{params[:instance_name]}",
      headers: headers,
      body: build_media_payload(params).to_json,
      **request_options
    )
    handle_response(response)
  end

  def get_base64_from_media_message(instance_name:, message:, convert_to_mp4: false)
    response = HTTParty.post(
      "#{@base_url}/chat/getBase64FromMediaMessage/#{instance_name}",
      headers: headers,
      body: { message: message, convertToMp4: convert_to_mp4 }.to_json,
      **request_options
    )
    handle_response(response)
  end

  private

  def headers
    {
      'apikey' => @api_key,
      'Content-Type' => 'application/json'
    }
  end

  def request_options
    { timeout: REQUEST_TIMEOUT }
  end

  def build_instance_payload(instance_name, webhook_url)
    {
      instanceName: instance_name,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      webhook: {
        url: webhook_url,
        byEvents: false,
        base64: true,
        events: webhook_events
      }
    }
  end

  def webhook_events
    %w[
      QRCODE_UPDATED
      MESSAGES_UPSERT
      MESSAGES_UPDATE
      MESSAGES_DELETE
      SEND_MESSAGE
      CONNECTION_UPDATE
    ]
  end

  def build_media_payload(params)
    {
      number: params[:number],
      mediatype: params[:media_type],
      media: params[:media_url],
      caption: params[:caption] || '',
      fileName: params[:filename] || ''
    }
  end

  def handle_response(response)
    if response.success?
      response.parsed_response
    else
      error_message = extract_error_message(response)
      Rails.logger.error("Evolution API error [#{response.code}]: #{error_message} | URL: #{response.request.uri}")
      raise StandardError, error_message
    end
  end

  def extract_error_message(response)
    parsed = response.parsed_response
    return response.body unless parsed.is_a?(Hash)

    parsed['message'] || parsed.dig('response', 'message') || parsed['error'] || response.body
  end
end
