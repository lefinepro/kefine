import { describe, expect, test } from 'bun:test';
import { bodyFromFields, createBodyFields, parseBodyFields } from './solution-testing-body';

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
});
