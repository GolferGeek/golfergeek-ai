// E2E tests hitting live API server

import axios from 'axios';

describe('A2A Protocol Integration', () => {
  const baseUrl = 'http://localhost:3333/api';
  let agentCards: Record<string, any> = {};

  test('Step 1: Get agent cards for all agents', async () => {
    const agentEndpoints = [
      `${baseUrl}/agents/a2a/orchestrator/.well-known/agent.json`,
      `${baseUrl}/agents/a2a/vue-core/.well-known/agent.json`,
      `${baseUrl}/agents/a2a/vuex/.well-known/agent.json`,
    ];
    agentCards = {};
    for (const endpoint of agentEndpoints) {
      const response = await axios.get(endpoint);
      expect(response.data).toHaveProperty('name');
      agentCards[response.data.name] = response.data;
    }
  });

  test('Step 2: Directly test the Vue Core agent', async () => {
    const vueCoreCard = agentCards['Vue Core A2A Agent'];
    expect(vueCoreCard).toBeDefined();
    const jsonRpcVueCoreDirectRequest = {
      jsonrpc: '2.0',
      id: 'direct-test-1',
      method: 'tasks/send',
      params: {
        id: 'direct-vue-core-task',
        message: {
          role: 'user',
          parts: [{ type: 'text', text: 'How do Vue components work?' }],
        },
      },
    };
    const response = await axios.post(vueCoreCard.url, jsonRpcVueCoreDirectRequest);
    expect(response.data).toHaveProperty('result');
  });

  test('Step 3: Directly test the Vuex agent', async () => {
    const vuexCard = agentCards['Vuex A2A Agent'];
    expect(vuexCard).toBeDefined();
    const jsonRpcVuexDirectRequest = {
      jsonrpc: '2.0',
      id: 'direct-test-2',
      method: 'tasks/send',
      params: {
        id: 'direct-vuex-task',
        message: {
          role: 'user',
          parts: [{ type: 'text', text: 'How do I use Vuex for state management?' }],
        },
      },
    };
    const response = await axios.post(vuexCard.url, jsonRpcVuexDirectRequest);
    expect(response.data).toHaveProperty('result');
  });

  test('Step 4: Manually register agents in the orchestrator', async () => {
    const response = await axios.post(`${baseUrl}/agents/a2a/orchestrator/register-agents`);
    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('message');
  });

  test('Step 5: Ask orchestrator to list available agents', async () => {
    const jsonRpcListAgentsRequest = {
      jsonrpc: '2.0',
      id: 'test-1',
      method: 'tasks/send',
      params: {
        id: 'list-agents-task',
        message: {
          role: 'user',
          parts: [{ type: 'text', text: 'list agents' }],
        },
      },
    };
    const response = await axios.post(`${baseUrl}/agents/a2a/orchestrator`, jsonRpcListAgentsRequest);
    expect(response.data).toHaveProperty('result');
  });
}); 