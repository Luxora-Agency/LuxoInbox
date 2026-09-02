import { CATEGORIES } from './categories';

import gettingStarted from './gettingStarted';
import navigation from './navigation';
import searchAndCommands from './searchAndCommands';
import profileAndPreferences from './profileAndPreferences';
import notificationsInbox from './notificationsInbox';
import accounts from './accounts';
import conversations from './conversations';
import replying from './replying';
import conversationViews from './conversationViews';
import conversationFilters from './conversationFilters';
import bulkActions from './bulkActions';
import conversationActions from './conversationActions';
import contactPanel from './contactPanel';
import composerAdvanced from './composerAdvanced';
import copilot from './copilot';
import contacts from './contacts';
import contactsSearchSegments from './contactsSearchSegments';
import contactDetail from './contactDetail';
import contactsBulkImport from './contactsBulkImport';
import companies from './companies';
import inboxes from './inboxes';
import inboxWebsite from './inboxWebsite';
import inboxWhatsapp from './inboxWhatsapp';
import inboxSocial from './inboxSocial';
import inboxEmail from './inboxEmail';
import inboxMessaging from './inboxMessaging';
import inboxVoice from './inboxVoice';
import inboxSettings from './inboxSettings';
import whatsappTemplates from './whatsappTemplates';
import team from './team';
import agents from './agents';
import teams from './teams';
import customRoles from './customRoles';
import agentBots from './agentBots';
import productivity from './productivity';
import assignment from './assignment';
import labels from './labels';
import cannedResponses from './cannedResponses';
import macros from './macros';
import automationRules from './automationRules';
import sla from './sla';
import conversationWorkflow from './conversationWorkflow';
import luxoiaOverview from './luxoiaOverview';
import luxoiaFaqs from './luxoiaFaqs';
import luxoiaDocuments from './luxoiaDocuments';
import luxoiaScenarios from './luxoiaScenarios';
import luxoiaPlayground from './luxoiaPlayground';
import luxoiaInboxes from './luxoiaInboxes';
import luxoiaSettings from './luxoiaSettings';
import luxoiaTools from './luxoiaTools';
import campaigns from './campaigns';
import campaignLiveChat from './campaignLiveChat';
import campaignSms from './campaignSms';
import campaignWhatsapp from './campaignWhatsapp';
import helpCenter from './helpCenter';
import portalSetup from './portalSetup';
import articles from './articles';
import categoriesAndLocales from './categoriesAndLocales';
import reports from './reports';
import reportsFilters from './reportsFilters';
import reportsConversationsAgents from './reportsConversationsAgents';
import reportsLabelsInboxesTeams from './reportsLabelsInboxesTeams';
import reportsCsatSlaBot from './reportsCsatSlaBot';
import accountSettings from './accountSettings';
import integrations from './integrations';
import dataImport from './dataImport';
import auditLogs from './auditLogs';
import securitySso from './securitySso';
import billing from './billing';
import calls from './calls';

// The whole library, sorted by `order`. Because a tour's order is its
// category's order plus its position inside the category, this flat list is
// already in the grouped reading order the hub renders.
export const TOURS = [
  gettingStarted,
  navigation,
  searchAndCommands,
  profileAndPreferences,
  notificationsInbox,
  accounts,
  conversations,
  replying,
  conversationViews,
  conversationFilters,
  bulkActions,
  conversationActions,
  contactPanel,
  composerAdvanced,
  copilot,
  contacts,
  contactsSearchSegments,
  contactDetail,
  contactsBulkImport,
  companies,
  inboxes,
  inboxWebsite,
  inboxWhatsapp,
  inboxSocial,
  inboxEmail,
  inboxMessaging,
  inboxVoice,
  inboxSettings,
  whatsappTemplates,
  team,
  agents,
  teams,
  customRoles,
  agentBots,
  productivity,
  assignment,
  labels,
  cannedResponses,
  macros,
  automationRules,
  sla,
  conversationWorkflow,
  luxoiaOverview,
  luxoiaFaqs,
  luxoiaDocuments,
  luxoiaScenarios,
  luxoiaPlayground,
  luxoiaInboxes,
  luxoiaSettings,
  luxoiaTools,
  campaigns,
  campaignLiveChat,
  campaignSms,
  campaignWhatsapp,
  helpCenter,
  portalSetup,
  articles,
  categoriesAndLocales,
  reports,
  reportsFilters,
  reportsConversationsAgents,
  reportsLabelsInboxesTeams,
  reportsCsatSlaBot,
  accountSettings,
  integrations,
  dataImport,
  auditLogs,
  securitySso,
  billing,
  calls,
].sort((a, b) => a.order - b.order);

export const getTourById = id => TOURS.find(tour => tour.id === id);

/**
 * The catalog grouped into shelves, both orders respected. Categories with no
 * tours are dropped so a caller never renders an empty shelf.
 * @returns {Array<{ category: Object, tours: Array }>}
 */
export const getToursByCategory = () =>
  CATEGORIES.map(category => ({
    category,
    tours: TOURS.filter(tour => tour.category === category.id),
  })).filter(shelf => shelf.tours.length > 0);
