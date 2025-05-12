import { RetrievalService, SearchResult } from './retrieval.service';

describe('RetrievalService', () => {
  describe('prepareContextForLLM', () => {
    it('should format context string with titles and contents', () => {
      const service = new RetrievalService({} as any, {} as any);
      const docs: SearchResult[] = [
        { id: '1', docId: '1', score: 1, content: 'Vue intro', metadata: { title: 'Introduction' } },
        { id: '2', docId: '2', score: 1, content: 'Vuex overview', metadata: { title: 'Vuex' } },
      ];
      const context = service.prepareContextForLLM(docs);
      expect(context).toContain('Document 1: "Introduction"');
      expect(context).toContain('Vue intro');
    });
  });
}); 