import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'luxoia-documents',
  category: 'ai',
  icon: 'i-lucide-file-text',
  order: 720,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.CAPTAIN,
  permissions: ['administrator', 'agent'],
  installationTypes: ['cloud', 'enterprise', 'community'],
  estimatedMinutes: 4,
  route: {
    name: 'captain_assistants_index',
    params: { navigationPath: 'captain_assistants_documents_index' },
  },
  pageRoutes: ['captain_assistants_documents_index'],
  keywords: [
    'documentos',
    'documents',
    'pdf',
    'url',
    'sincronizar',
    'conocimiento',
  ],
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="sidebar-luxoia-documents"]',
      i18nKey: 'LUXOIA_DOCUMENTS.NAV',
      before: { expandSidebarGroup: 'LuxoIA' },
      side: 'right',
      align: 'start',
    },
    {
      target: '[data-tour="captain-documents"]',
      i18nKey: 'LUXOIA_DOCUMENTS.PAGE',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_DOCUMENTS.ADD',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_DOCUMENTS.STATUS',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_DOCUMENTS.SYNC',
    },
    {
      target: '[data-tour="sidebar-luxoia-faqs"]',
      i18nKey: 'LUXOIA_DOCUMENTS.REVIEW',
      before: { expandSidebarGroup: 'LuxoIA' },
      side: 'right',
      align: 'start',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_DOCUMENTS.FINISH',
    },
  ],
};
