import { describe, expect, test } from 'vitest';
import {
  bodyFromFields,
  createBodyFields,
  parseBodyFields,
  parseResponseFields
} from './solution-testing-body';

describe('solution testing body fields', () => {
  test('creates a filled form field from a sample JSON body', () => {
    expect(createBodyFields('{\n  "ping": "hello"\n}')).toEqual([
      {
        id: 'body-field-0-ping',
        key: 'ping',
        value: 'hello'
      }
    ]);
  });

  test('serializes form fields back to formatted JSON', () => {
    expect(bodyFromFields([{ id: 'body-field-0-ping', key: 'ping', value: 'hello' }])).toBe(
      '{\n  "ping": "hello"\n}'
    );
  });

  test('leaves invalid JSON unavailable for form sync', () => {
    expect(parseBodyFields('{')).toBeNull();
  });

  test('parses a JSON response into readable fields with primitive coercion', () => {
    expect(parseResponseFields('{\n  "ok": true,\n  "message": "proxy ready"\n}')).toEqual([
      { id: 'response-field-0-ok', key: 'ok', value: 'true' },
      { id: 'response-field-1-message', key: 'message', value: 'proxy ready' }
    ]);
  });

  test('returns null for non-object or unparsable responses', () => {
    expect(parseResponseFields(null)).toBeNull();
    expect(parseResponseFields('plain text')).toBeNull();
    expect(parseResponseFields('[1, 2, 3]')).toBeNull();
  });
});
