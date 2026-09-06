// Snapshot cursor pages must load sequentially; a later page depends on the previous response.
/* eslint-disable no-await-in-loop */
import { getConversationScreenshot } from 'dashboard/api/messengerSimulator';
import { readAvatar } from './avatar';
import { ScreenshotExportError } from './exportScreenshot';

const MAX_MESSAGES = 5000;
const MAX_CHARACTERS = 2000000;

export const loadConversationScreenshot = async ({
  accountId,
  conversationId,
  isCurrent,
  t,
}) => {
  const attachmentLabels = {
    image: t('MESSENGER_SIMULATOR.MEDIA.IMAGE'),
    audio: t('MESSENGER_SIMULATOR.MEDIA.AUDIO'),
    video: t('MESSENGER_SIMULATOR.MEDIA.VIDEO'),
    file: t('MESSENGER_SIMULATOR.MEDIA.FILE'),
    location: t('MESSENGER_SIMULATOR.MEDIA.LOCATION'),
    fallback: t('MESSENGER_SIMULATOR.MEDIA.ATTACHMENT'),
    share: t('MESSENGER_SIMULATOR.MEDIA.SHARED'),
    story_mention: t('MESSENGER_SIMULATOR.MEDIA.STORY_MENTION'),
    contact: t('MESSENGER_SIMULATOR.MEDIA.CONTACT'),
    ig_reel: t('MESSENGER_SIMULATOR.MEDIA.REEL'),
    ig_post: t('MESSENGER_SIMULATOR.MEDIA.POST'),
    ig_story: t('MESSENGER_SIMULATOR.MEDIA.STORY'),
    embed: t('MESSENGER_SIMULATOR.MEDIA.EMBEDDED'),
  };
  const messages = [];
  let after = 0;
  let snapshot;
  let contact;
  let characterCount = 0;
  let requests = 0;
  do {
    requests += 1;
    if (requests > 200) throw new ScreenshotExportError('limit');
    const { data } = await getConversationScreenshot(
      accountId,
      conversationId,
      {
        after,
        ...(snapshot === undefined ? {} : { snapshot_max_id: snapshot }),
      }
    );
    if (!isCurrent()) throw new ScreenshotExportError('cancelled');
    if (snapshot === undefined) {
      snapshot = data.snapshot_max_id;
      contact = data.contact;
    }
    messages.push(...data.messages);
    characterCount += data.messages.reduce(
      (sum, message) => sum + message.text.length,
      0
    );
    if (messages.length > MAX_MESSAGES || characterCount > MAX_CHARACTERS) {
      throw new ScreenshotExportError('limit');
    }
    if (data.next_cursor !== null && data.next_cursor <= after) {
      throw new ScreenshotExportError('pagination');
    }
    after = data.next_cursor;
  } while (after !== null);

  if (!messages.length) throw new ScreenshotExportError('empty');
  let avatar = '';
  if (contact.avatar_data) {
    const [header, encoded] = contact.avatar_data.split(',');
    const bytes = Uint8Array.from(atob(encoded), character =>
      character.charCodeAt(0)
    );
    avatar = await readAvatar(
      new File([bytes], 'avatar', { type: header.slice(5).split(';')[0] })
    );
  }
  if (!isCurrent()) throw new ScreenshotExportError('cancelled');
  return {
    participants: {
      incoming: {
        name: contact.name || t('MESSENGER_SIMULATOR.INCOMING'),
        avatar,
      },
      outgoing: { name: t('MESSENGER_SIMULATOR.OUTGOING'), avatar: '' },
    },
    messages: messages
      .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id)
      .map(message => {
        const attachments = message.attachments.map(
          attachment =>
            `[${attachmentLabels[attachment.type] || attachmentLabels.fallback}]`
        );
        let text = [message.text, ...attachments].filter(Boolean).join('\n');
        if (!text.trim()) text = t('MESSENGER_SIMULATOR.STRUCTURED_MESSAGE');
        if (message.status === 'failed')
          text += `\n[${t('MESSENGER_SIMULATOR.NOT_SENT')}]`;
        return {
          id: message.id,
          sender: message.direction,
          text,
          time: new Date(message.created_at).toLocaleString(undefined, {
            dateStyle: 'short',
            timeStyle: 'short',
          }),
        };
      }),
  };
};
