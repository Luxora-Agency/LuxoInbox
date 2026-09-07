require 'rails_helper'

RSpec.describe MessengerTemplates::ScreenshotExtractionService do
  let(:account) { create(:account) }
  let(:service) { described_class.new(account: account, image: 'raw-png-bytes', content_type: 'image/png') }
  let(:payload) do
    {
      'business_name' => '  Ana Suárez  ',
      'messages' => [
        { 'sender' => 'outgoing', 'text' => 'Tu cita es el 12 de mayo', 'time' => '06:00 AM' },
        { 'sender' => 'incoming', 'text' => 'Gracias', 'time' => nil }
      ],
      'variables' => []
    }
  end

  before { allow(service).to receive(:make_api_call).and_return(message: payload, usage: { 'total_tokens' => 42 }) }

  it 'returns a v1 definition with the exact keys the template contract allows' do
    result = service.perform

    expect(result[:definition]).to eq(
      'version' => 1,
      'business_name' => 'Ana Suárez',
      'avatar' => 'contact',
      'messages' => [
        { 'sender' => 'outgoing', 'text' => 'Tu cita es el 12 de mayo', 'time' => '06:00 AM' },
        { 'sender' => 'incoming', 'text' => 'Gracias', 'time' => '' }
      ]
    )
    expect(result[:usage]).to eq('total_tokens' => 42)
    expect(build(:messenger_template, account: account, definition: result[:definition])).to be_valid
  end

  it 'asks the routed model for the structured output and sends the screenshot with the prompt' do
    service.perform

    expect(service).to have_received(:make_api_call) do |feature:, messages:, schema:|
      expect(feature).to eq('messenger_template_extraction')
      expect(schema).to eq(MessengerTemplates::ScreenshotExtractionSchema)
      expect(messages.first[:role]).to eq('system')
      attachment = messages.last[:content].attachments.first
      expect(messages.last[:content]).to be_a(RubyLLM::Content)
      expect(attachment.filename).to eq('screenshot.png')
      expect(attachment.content).to eq('raw-png-bytes')
    end
  end

  it 'clamps the response to the limits the template model enforces' do
    payload['business_name'] = 'a' * 80
    payload['messages'] = ([{ 'sender' => 'incoming', 'text' => 'b' * 700, 'time' => 'c' * 45 }] * 40)
    definition = service.perform[:definition]

    expect(definition['business_name'].length).to eq(MessengerTemplate::BUSINESS_NAME_LIMIT)
    expect(definition['messages'].length).to eq(MessengerTemplate::MESSAGES_LIMIT)
    expect(definition['messages'].first['text'].length).to eq(MessengerTemplate::MESSAGE_TEXT_LIMIT)
    expect(definition['messages'].first['time'].length).to eq(MessengerTemplate::MESSAGE_TIME_LIMIT)
  end

  it 'drops messages the template definition could never hold' do
    payload['messages'] = [
      { 'sender' => 'system', 'text' => 'Today', 'time' => nil },
      { 'sender' => 'incoming', 'text' => '   ', 'time' => nil },
      'not a message',
      { 'sender' => 'incoming', 'text' => 'Hola', 'time' => nil }
    ]

    expect(service.perform[:definition]['messages']).to eq([{ 'sender' => 'incoming', 'text' => 'Hola', 'time' => '' }])
  end

  it 'keeps only suggestions the dashboard can apply, and derives the kind from the key' do
    payload['variables'] = [
      { 'kind' => 'manual', 'key' => 'manual.fecha_cita', 'original_text' => '12 de mayo', 'label' => 'Fecha', 'reason' => 'Cambia' },
      { 'kind' => 'manual', 'key' => 'manual.fecha_cita', 'original_text' => '12 de mayo', 'label' => 'Otra', 'reason' => 'Repetida' },
      { 'kind' => 'manual', 'key' => 'contact.name', 'original_text' => 'Ana Suárez', 'label' => 'Nombre', 'reason' => 'Es el contacto' },
      { 'kind' => 'dynamic', 'key' => 'contact.nickname', 'original_text' => 'Gracias', 'label' => 'x', 'reason' => 'y' },
      { 'kind' => 'manual', 'key' => 'manual.Precio', 'original_text' => 'Gracias', 'label' => 'x', 'reason' => 'y' },
      { 'kind' => 'manual', 'key' => 'manual.precio', 'original_text' => 'no está en la captura', 'label' => 'x', 'reason' => 'y' },
      { 'kind' => 'manual', 'key' => 'manual.vacio', 'original_text' => '', 'label' => 'x', 'reason' => 'y' }
    ]

    expect(service.perform[:suggestions]).to eq(
      [
        { kind: 'manual', key: 'manual.fecha_cita', original_text: '12 de mayo', label: 'Fecha', reason: 'Cambia' },
        { kind: 'dynamic', key: 'contact.name', original_text: 'Ana Suárez', label: 'Nombre', reason: 'Es el contacto' }
      ]
    )
  end

  it 'passes the engine error through without the request that carried the screenshot' do
    allow(service).to receive(:make_api_call).and_return(error: 'No API key', error_code: 401, request_messages: [{ role: 'user' }])

    expect(service.perform).to eq(error: 'No API key', error_code: 401)
  end

  it 'stays out of the Captain quota and follows the messenger simulator feature' do
    expect(service.send(:counts_toward_usage?)).to be(false)
    expect(service.send(:use_account_openai_hook?)).to be(true)
    expect(service.send(:captain_tasks_enabled?)).to be(false)
    account.enable_features!('messenger_simulator')
    expect(described_class.new(account: account.reload, image: 'x', content_type: 'image/png').send(:captain_tasks_enabled?)).to be(true)
  end
end
