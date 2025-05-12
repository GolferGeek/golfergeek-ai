import axios, { AxiosError } from 'axios';

/**
 * Test agent routing in the A2A protocol
 * Verifies that the orchestrator selects the right agent based on query content
 */
async function testAgentRouting() {
  const baseUrl = 'http://localhost:3333/api';
  
  try {
    console.log('A2A Agent Routing Test');
    console.log('=====================\n');
    
    // Step 1: Register the agents
    console.log('Step 1: Register agents in the orchestrator');
    
    try {
      const response = await axios.post(`${baseUrl}/agents/a2a/orchestrator/register-agents`);
      console.log('✅ Manual agent registration results:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Agent count: ${response.data.count}`);
      
      if (response.data.agents && response.data.agents.length > 0) {
        console.log('\nRegistered agents:');
        response.data.agents.forEach((agent: any, index: number) => {
          console.log(`${index + 1}. ${agent.name}`);
        });
      }
    } catch (error) {
      console.error('❌ Error registering agents:', (error as Error).message);
    }
    
    console.log('\n');
    
    // List of test queries and expected agents
    console.log('Step 2: Testing agent routing for different queries\n');
    
    const testCases = [
      {
        query: 'How do Vue components communicate with each other?',
        expectedAgent: 'Vue Core A2A Agent',
        keywords: 'components'
      },
      {
        query: 'What are Vue component lifecycle hooks?',
        expectedAgent: 'Vue Core A2A Agent',
        keywords: 'lifecycle'
      },
      {
        query: 'How do I manage state in a Vue application?',
        expectedAgent: 'Vuex A2A Agent',
        keywords: 'state'
      },
      {
        query: 'How can I use getters in Vuex?',
        expectedAgent: 'Vuex A2A Agent',
        keywords: 'getters'
      },
      {
        query: 'Explain Vuex actions and mutations',
        expectedAgent: 'Vuex A2A Agent',
        keywords: 'actions, mutations'
      },
      {
        query: 'How do I use Vue directives?',
        expectedAgent: 'Vue Core A2A Agent',
        keywords: 'directives'
      }
    ];
    
    for (const [index, testCase] of testCases.entries()) {
      console.log(`Test ${index + 1}: "${testCase.query}"`);
      console.log(`   Keywords: ${testCase.keywords}`);
      console.log(`   Expected agent: ${testCase.expectedAgent}`);
      
      const jsonRpcRequest = {
        jsonrpc: '2.0',
        id: `test-${index + 1}`,
        method: 'tasks/send',
        params: {
          id: `routing-test-${index + 1}`,
          message: {
            role: 'user',
            parts: [{ type: 'text', text: testCase.query }]
          }
        }
      };
      
      try {
        const response = await axios.post(`${baseUrl}/agents/a2a/orchestrator`, jsonRpcRequest);
        
        if (response.data.result) {
          const taskStatus = response.data.result.status.state;
          const responseText = response.data.result.status.message?.parts[0].text || '';
          const selectedAgent = responseText.split('\n')[0].replace(' responds:', '');
          
          console.log(`   Response from: ${selectedAgent}`);
          
          if (selectedAgent.includes(testCase.expectedAgent)) {
            console.log('   ✅ Correct agent selected');
          } else {
            console.log(`   ❌ Wrong agent selected. Expected: ${testCase.expectedAgent}`);
          }
        } else {
          console.error('   ❌ Error in response:', response.data.error);
        }
      } catch (error) {
        console.error(`   ❌ Error sending request: ${(error as Error).message}`);
      }
      
      console.log('\n');
    }
    
    console.log('Test completed.');
    
  } catch (error) {
    console.error('Failed to run agent routing test:', (error as Error).message);
  }
}

// Run the test
testAgentRouting(); 