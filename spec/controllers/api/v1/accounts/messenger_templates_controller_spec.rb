require 'rails_helper'

RSpec.describe 'Messenger templates API', type: :request do
  let(:account) { create(:account) }
  let(:admin) { create(:user, account: account, role: :administrator) }
  let(:agent) { create(:user, account: account, role: :agent) }
  let(:template) { create(:messenger_template, account: account) }
  let(:path) { "/api/v1/accounts/#{account.id}/messenger_templates" }
  let(:attributes) { attributes_for(:messenger_template) }

  before { account.enable_features!('messenger_simulator') }

  it 'lets administrators create, update, duplicate and delete scripts' do
    post path, params: { messenger_template: attributes }, headers: admin.create_new_auth_token, as: :json
    expect(response).to have_http_status(:created)
    id = response.parsed_body['id']
    patch "#{path}/#{id}", params: { messenger_template: { title: 'Updated' } }, headers: admin.create_new_auth_token, as: :json
    expect(response.parsed_body['title']).to eq('Updated')
    post path, params: { messenger_template: attributes }, headers: admin.create_new_auth_token, as: :json
    expect(response).to have_http_status(:created)
    expect(account.messenger_templates.count).to eq(2)
    delete "#{path}/#{id}", headers: admin.create_new_auth_token
    expect(response).to have_http_status(:no_content)
    expect(account.messenger_templates.count).to eq(1)
  end

  it 'lets agents read only their account library' do
    other_template = create(:messenger_template)
    template
    get path, headers: agent.create_new_auth_token
    expect(response.parsed_body.pluck('id')).to include(template.id)
    expect(response.parsed_body.pluck('id')).not_to include(other_template.id)
    expect(response.headers['Cache-Control']).to include('no-store')
    get "#{path}/#{other_template.id}", headers: agent.create_new_auth_token
    expect(response).to have_http_status(:not_found)
  end

  it 'seeds the default script once and lists it ahead of a title that sorts earlier' do
    create(:messenger_template, account: account, title: 'A script that sorts first')
    get path, headers: agent.create_new_auth_token
    expect(response.parsed_body.first['is_default']).to be(true)
    expect(response.parsed_body.first['title']).to eq(MessengerTemplates::DefaultTemplate.title)
    get path, headers: admin.create_new_auth_token
    expect(response.parsed_body.count { |item| item['is_default'] }).to eq(1)
    expect(account.messenger_templates.count).to eq(2)
  end

  it 'recreates the default after a delete and resets it after an edit' do
    get path, headers: admin.create_new_auth_token
    delete "#{path}/#{response.parsed_body.first['id']}", headers: admin.create_new_auth_token
    post "#{path}/restore_default", headers: admin.create_new_auth_token, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body['is_default']).to be(true)
    restored_id = response.parsed_body['id']
    patch "#{path}/#{restored_id}", params: { messenger_template: { title: 'Renamed' } },
                                    headers: admin.create_new_auth_token, as: :json
    post "#{path}/restore_default", headers: admin.create_new_auth_token, as: :json
    expect(response.parsed_body['id']).to eq(restored_id)
    expect(response.parsed_body['title']).to eq(MessengerTemplates::DefaultTemplate.title)
    expect(account.messenger_templates.count).to eq(1)
  end

  it 'denies restoring the default to agents and to other accounts' do
    post "#{path}/restore_default", headers: agent.create_new_auth_token, as: :json
    expect(response).to have_http_status(:unauthorized)
    post "/api/v1/accounts/#{create(:account).id}/messenger_templates/restore_default",
         headers: admin.create_new_auth_token, as: :json
    expect(response).to have_http_status(:unauthorized)
    expect(account.messenger_templates.count).to be_zero
  end

  it 'ignores a default flag sent by the client on create and on update' do
    post path, params: { messenger_template: attributes.merge(is_default: true) },
               headers: admin.create_new_auth_token, as: :json
    expect(response).to have_http_status(:created)
    expect(response.parsed_body['is_default']).to be(false)
    patch "#{path}/#{response.parsed_body['id']}", params: { messenger_template: { is_default: true } },
                                                   headers: admin.create_new_auth_token, as: :json
    expect(response.parsed_body['is_default']).to be(false)
  end

  it 'rejects a duplicate title within the account and names the field' do
    template
    post path, params: { messenger_template: attributes }, headers: admin.create_new_auth_token, as: :json
    expect(response).to have_http_status(:unprocessable_entity)
    expect(response.parsed_body['attributes']).to include('title')
    expect(response.parsed_body['message']).to include(I18n.t('errors.messenger_template.title.taken'))
    expect(account.messenger_templates.count).to eq(1)
  end

  it 'explains which variable a definition may not use' do
    definition = attributes[:definition].merge(messages: [{ sender: 'outgoing', text: 'Hi {{contact.nickname}}', time: '' }])
    post path, params: { messenger_template: attributes.merge(definition: definition) },
               headers: admin.create_new_auth_token, as: :json
    expect(response).to have_http_status(:unprocessable_entity)
    expect(response.parsed_body['message']).to include('{{contact.nickname}}')
    expect(account.messenger_templates.count).to be_zero
  end

  it 'accepts the widened registry, spaced tokens and custom attributes' do
    definition = attributes[:definition].merge(
      messages: [{ sender: 'outgoing', text: 'Hi {{ contact.first_name }} on {{contact.custom_attribute.plan}} - {{agent.name}}', time: '' }]
    )
    post path, params: { messenger_template: attributes.merge(definition: definition) },
               headers: admin.create_new_auth_token, as: :json
    expect(response).to have_http_status(:created)
    expect(response.parsed_body['definition']['messages'][0]['text']).to include('{{contact.custom_attribute.plan}}')
  end

  it 'serves the shared variable registry to anyone who can read the library' do
    get "#{path}/variables", headers: agent.create_new_auth_token
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.pluck('key')).to include('contact.name', 'contact.phone', 'contact.company_name', 'agent.first_name')
    expect(response.parsed_body.map { |variable| variable['group'] }.uniq).to contain_exactly('contact', 'agent')
    expect(response.parsed_body.first.keys).to contain_exactly('key', 'label_key', 'group', 'sample')
  end

  it 'denies the variable registry to nonmembers and disabled accounts' do
    get "#{path}/variables", headers: create(:user).create_new_auth_token
    expect(response).to have_http_status(:unauthorized)
    account.disable_features!('messenger_simulator')
    get "#{path}/variables", headers: admin.create_new_auth_token
    expect(response).to have_http_status(:unauthorized)
  end

  it 'denies agent writes' do
    headers = agent.create_new_auth_token
    post path, params: { messenger_template: attributes }, headers: headers, as: :json
    expect(response).to have_http_status(:unauthorized)
    patch "#{path}/#{template.id}", params: { messenger_template: { title: 'Changed' } }, headers: headers, as: :json
    expect(response).to have_http_status(:unauthorized)
    delete "#{path}/#{template.id}", headers: headers
    expect(response).to have_http_status(:unauthorized)
    expect(template.reload.title).to eq('Welcome script')
  end

  it 'denies disabled features and nonmembers' do
    account.disable_features!('messenger_simulator')
    get path, headers: admin.create_new_auth_token
    expect(response).to have_http_status(:unauthorized)
    account.enable_features!('messenger_simulator')
    get path, headers: create(:user).create_new_auth_token
    expect(response).to have_http_status(:unauthorized)
  end

  it 'rejects invalid definitions and ignores account reassignment' do
    post path, params: { messenger_template: attributes.merge(definition: { messages: [] }) },
               headers: admin.create_new_auth_token, as: :json
    expect(response).to have_http_status(:unprocessable_entity)
    other_account = create(:account)
    post path, params: { messenger_template: attributes.merge(account_id: other_account.id) },
               headers: admin.create_new_auth_token, as: :json
    expect(response).to have_http_status(:created)
    expect(MessengerTemplate.find(response.parsed_body['id']).account_id).to eq(account.id)
  end

  it 'rejects malformed definition updates without changing the saved script' do
    [nil, [], 'invalid'].each do |definition|
      patch "#{path}/#{template.id}", params: { messenger_template: { definition: definition } },
                                      headers: admin.create_new_auth_token, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
      expect(template.reload.definition['version']).to eq(1)
    end
  end

  it 'denies unauthenticated access and cross-account administrator writes' do
    get path
    expect(response).to have_http_status(:unauthorized)
    foreign_template = create(:messenger_template)
    patch "#{path}/#{foreign_template.id}", params: { messenger_template: { title: 'Changed' } },
                                            headers: admin.create_new_auth_token, as: :json
    expect(response).to have_http_status(:not_found)
    delete "#{path}/#{foreign_template.id}", headers: admin.create_new_auth_token
    expect(response).to have_http_status(:not_found)
    expect(foreign_template.reload.title).to eq('Welcome script')
  end

  it 'rejects non-object envelopes and non-string titles' do
    ['invalid', [attributes], { title: [] }, { title: { value: 'Invalid' } }, { title: 12 }].each do |input|
      patch "#{path}/#{template.id}", params: { messenger_template: input }, headers: admin.create_new_auth_token, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
      expect(template.reload.title).to eq('Welcome script')
    end
  end
end
