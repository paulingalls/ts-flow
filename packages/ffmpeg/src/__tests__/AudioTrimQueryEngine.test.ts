import { AudioTrimQueryEngine } from '../AudioTrimQueryEngine';
import { IContainer, JSONObject } from '@ts-flow/core';

// Mock the nanoid function
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'uniqueId'),
}));

describe('AudioTrimQueryEngine', () => {
  let audioTrimQueryEngine: AudioTrimQueryEngine;
  let mockContainer: IContainer;
  let mockConfig: JSONObject;

  beforeEach(() => {
    mockConfig = {
      inputProperty: 'audioData',
      trimLength: 300, // 5 minutes in seconds
    };

    mockContainer = {
      getInstance: jest.fn(),
      getInstances: jest.fn(),
      getNodeNames: jest.fn(),
      createInstance: jest.fn(),
    };

    audioTrimQueryEngine = new AudioTrimQueryEngine('testId', mockContainer, mockConfig);
  });

  it('should create an instance of AudioTrimQueryEngine', () => {
    expect(audioTrimQueryEngine).toBeInstanceOf(AudioTrimQueryEngine);
  });

});
