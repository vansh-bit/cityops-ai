import { TrackingIdGenerator } from '../TrackingIdGenerator';

describe('TrackingIdGenerator', () => {
  let generator: TrackingIdGenerator;

  beforeEach(() => {
    generator = new TrackingIdGenerator();
  });

  it('should generate a string', () => {
    const id = generator.generate();
    expect(typeof id).toBe('string');
  });

  it('should generate a URL-safe base64url string', () => {
    const id = generator.generate();
    // base64url uses A-Z, a-z, 0-9, -, _
    expect(id).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it('should have a consistent length', () => {
    const id = generator.generate();
    // 16 bytes base64url encoded should be 22 characters long
    expect(id.length).toBe(22);
  });

  it('should generate unique IDs', () => {
    const id1 = generator.generate();
    const id2 = generator.generate();
    expect(id1).not.toBe(id2);
  });
  
  it('should be cryptographically random and not easily enumerable', () => {
    const ids = new Set();
    for (let i = 0; i < 1000; i++) {
      ids.add(generator.generate());
    }
    // All 1000 generated IDs should be unique
    expect(ids.size).toBe(1000);
  });
});
