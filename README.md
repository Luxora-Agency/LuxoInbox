# LuxoInbox

Modern customer support platform by Luxora Agency. Based on Chatwoot open-source project.

---

LuxoInbox is a modern, self-hosted customer support platform designed to help businesses deliver exceptional customer support experience. Built for scale and flexibility, it gives you full control over your customer data while providing powerful tools to manage conversations across channels.

## Features

### Omnichannel Support Desk

LuxoInbox centralizes all customer conversations into one powerful inbox, no matter where your customers reach out from. It supports live chat on your website, email, Facebook, Instagram, Twitter, WhatsApp, Telegram, Line, SMS etc.

### Help Center Portal

Publish help articles, FAQs, and guides through the built-in Help Center Portal. Enable customers to find answers on their own, reduce repetitive queries, and keep your support team focused on more complex issues.

### AI Agent for Support

Supercharge your support with Captain, the AI agent. Captain helps automate responses, handle common queries, and reduce agent workload—ensuring customers get instant, accurate answers.

### Collaboration & Productivity

- Private Notes and @mentions for internal team discussions
- Labels to organize and categorize conversations
- Keyboard Shortcuts and a Command Bar for quick navigation
- Canned Responses to reply faster to frequently asked questions
- Auto-Assignment to route conversations based on agent availability
- Multi-lingual Support to serve customers in multiple languages
- Custom Views and Filters for better inbox organization
- Business Hours and Auto-Responders to manage response expectations
- Teams and Automation tools for scaling support workflows

### Integrations

- Slack Integration to manage conversations directly from Slack
- Dialogflow Integration for chatbot automation
- Dashboard Apps to embed internal tools
- Shopify Integration to view and manage customer orders
- Google Translate for real-time message translation
- Linear tickets management

### Reports & Insights

- Live View of ongoing conversations for real-time monitoring
- Conversation, Agent, Inbox, Label, and Team Reports
- CSAT Reports to measure customer satisfaction
- Downloadable Reports for offline analysis

## Development

```bash
# Setup
bundle install && pnpm install

# Start Docker services (PostgreSQL, Redis, Mailhog)
docker compose -f docker-compose.dev.yml up -d

# Setup database
bundle exec rails db:prepare

# Run development server
pnpm dev
```

## Branching Model

We use the [git-flow](https://nvie.com/posts/a-successful-git-branching-model/) branching model. The base branch is `develop`.

## License

Based on Chatwoot - Released under the MIT License.

---

*LuxoInbox* by Luxora Agency
