import { describe, it, expect } from 'vitest';
import enTemplates from 'dashboard/i18n/locale/en/messengerTemplates.json';
import esTemplates from 'dashboard/i18n/locale/es/messengerTemplates.json';
import enSimulator from 'dashboard/i18n/locale/en/messengerSimulator.json';
import esSimulator from 'dashboard/i18n/locale/es/messengerSimulator.json';

// vue-i18n compiles every message and a bare `@` opens a linked message. The dev build
// only logs the syntax error, but the production compiler throws, which once emptied the
// whole variable catalog through an email sample. A literal `@` is written as {'@'}.
const UNESCAPED_AT = /(?<!\{')@(?!'\})/;

const leaves = (node, path = []) =>
  typeof node === 'string'
    ? [[path.join('.'), node]]
    : Object.entries(node).flatMap(([key, value]) =>
        leaves(value, [...path, key])
      );

describe('Messenger templates locale messages', () => {
  it.each([
    ['en/messengerTemplates', enTemplates],
    ['es/messengerTemplates', esTemplates],
    ['en/messengerSimulator', enSimulator],
    ['es/messengerSimulator', esSimulator],
  ])('%s has no unescaped @ for vue-i18n', (_, messages) => {
    const offenders = leaves(messages)
      .filter(([, text]) => UNESCAPED_AT.test(text))
      .map(([key]) => key);
    expect(offenders).toEqual([]);
  });
});
