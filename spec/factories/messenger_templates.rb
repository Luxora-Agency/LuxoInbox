FactoryBot.define do
  factory :messenger_template do
    account
    title { 'Welcome script' }
    definition do
      {
        version: 1, business_name: 'Support', avatar: 'contact',
        messages: [{ sender: 'outgoing', text: 'Hello {{contact.name}}', time: '' }]
      }
    end
  end
end
