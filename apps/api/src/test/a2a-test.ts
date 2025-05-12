import axios, { AxiosError } from 'axios';

/**
 * Test the A2A protocol implementation
 * Sends requests to the orchestrator and specialized agents
 */
async function testA2A() {
  const baseUrl = 'http://localhost:3333/api';
  
  try {
    console.log('A2A Protocol Test Script');
    console.log('=======================\n');
    
    // Step 1: Check if agents are available
    console.log('Step 1: Get agent cards for all agents');
    const agentEndpoints = [
      `${baseUrl}/agents/a2a/orchestrator/.well-known/agent.json`,
      `${baseUrl}/agents/a2a/vue-core/.well-known/agent.json`,
      `${baseUrl}/agents/a2a/vuex/.well-known/agent.json`
    ];
    
    // Map to store agent cards for later use
    const agentCards: Record<string, any> = {};
    
    for (const endpoint of agentEndpoints) {
      try {
        const response = await axios.get(endpoint);
        console.log(`✅ ${endpoint}: ${response.data.name}`);
        
        // Store the agent card for later use
        agentCards[response.data.name] = response.data;
      } catch (error) {
        console.error(`❌ ${endpoint}: Failed to retrieve agent card`);
        console.error((error as Error).message);
      }
    }
    
    console.log('\n');
    
    // Step 2: Directly test the Vue Core agent
    console.log('Step 2: Directly test the Vue Core agent');
    
    const vueCoreCard = agentCards['Vue Core A2A Agent'];
    if (!vueCoreCard) {
      console.error('❌ Vue Core agent card not found');
    } else {
      const jsonRpcVueCoreDirectRequest = {
        jsonrpc: '2.0',
        id: 'direct-test-1',
        method: 'tasks/send',
        params: {
          id: 'direct-vue-core-task',
          message: {
            role: 'user',
            parts: [{ type: 'text', text: 'How do Vue components work?' }]
          }
        }
      };
      
      try {
        const response = await axios.post(vueCoreCard.url, jsonRpcVueCoreDirectRequest);
        
        if (response.data.result) {
          console.log('✅ Direct Vue Core task created:');
          console.log(`   Task ID: ${response.data.result.id}`);
          console.log(`   Status: ${response.data.result.status.state}`);
          
          if (response.data.result.status.message) {
            console.log('\nResponse:');
            console.log(response.data.result.status.message.parts[0].text);
          }
        } else {
          console.error('❌ Error in response:', response.data.error);
        }
      } catch (error) {
        console.error('❌ Error sending direct Vue Core request:', (error as Error).message);
      }
    }
    
    console.log('\n');
    
    // Step 3: Directly test the Vuex agent
    console.log('Step 3: Directly test the Vuex agent');
    
    const vuexCard = agentCards['Vuex A2A Agent'];
    if (!vuexCard) {
      console.error('❌ Vuex agent card not found');
    } else {
      const jsonRpcVuexDirectRequest = {
        jsonrpc: '2.0',
        id: 'direct-test-2',
        method: 'tasks/send',
        params: {
          id: 'direct-vuex-task',
          message: {
            role: 'user',
            parts: [{ type: 'text', text: 'How do I use Vuex for state management?' }]
          }
        }
      };
      
      try {
        const response = await axios.post(vuexCard.url, jsonRpcVuexDirectRequest);
        
        if (response.data.result) {
          console.log('✅ Direct Vuex task created:');
          console.log(`   Task ID: ${response.data.result.id}`);
          console.log(`   Status: ${response.data.result.status.state}`);
          
          if (response.data.result.status.message) {
            console.log('\nResponse:');
            console.log(response.data.result.status.message.parts[0].text);
          }
        } else {
          console.error('❌ Error in response:', response.data.error);
        }
      } catch (error) {
        console.error('❌ Error sending direct Vuex request:', (error as Error).message);
      }
    }
    
    console.log('\n');
    
    // Step 4: Manually register agents
    console.log('Step 4: Manually register agents in the orchestrator');
    
    try {
      const response = await axios.post(`${baseUrl}/agents/a2a/orchestrator/register-agents`);
      console.log('✅ Manual agent registration results:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${response.data.message}`);
      console.log(`   Agent count: ${response.data.count}`);
      
      // List the registered agents
      if (response.data.agents && response.data.agents.length > 0) {
        console.log('\nRegistered agents:');
        response.data.agents.forEach((agent: any, index: number) => {
          console.log(`${index + 1}. ${agent.name} (${agent.url})`);
        });
      }
    } catch (error) {
      console.error('❌ Error registering agents:', (error as Error).message);
    }
    
    console.log('\n');
    
    // Step 5: Ask orchestrator to list available agents
    console.log('Step 5: Ask orchestrator to list available agents');
    
    const jsonRpcListAgentsRequest = {
      jsonrpc: '2.0',
      id: 'test-1',
      method: 'tasks/send',
      params: {
        id: 'list-agents-task',
        message: {
          role: 'user',
          parts: [{ type: 'text', text: 'list agents' }]
        }
      }
    };
    
    try {
      const response = await axios.post(`${baseUrl}/agents/a2a/orchestrator`, jsonRpcListAgentsRequest);
      
      if (response.data.result) {
        console.log('✅ Orchestrator task created:');
        console.log(`   Task ID: ${response.data.result.id}`);
        console.log(`   Status: ${response.data.result.status.state}`);
        
        if (response.data.result.status.message) {
          console.log('\nResponse:');
          console.log(response.data.result.status.message.parts[0].text);
        }
      } else {
        console.error('❌ Error in response:', response.data.error);
      }
    } catch (error) {
      console.error('❌ Error sending list agents request:', (error as Error).message);
    }
    
    console.log('\n');
    
    // Step 6: Test Vue Core query through the orchestrator
    console.log('Step 6: Test Vue Core query through orchestrator');
    
    const jsonRpcVueCoreRequest = {
      jsonrpc: '2.0',
      id: 'test-3',
      method: 'tasks/send',
      params: {
        id: 'vue-core-query-task',
        message: {
          role: 'user',
          parts: [{ type: 'text', text: 'How do Vue components work?' }]
        }
      }
    };
    
    try {
      const response = await axios.post(`${baseUrl}/agents/a2a/orchestrator`, jsonRpcVueCoreRequest);
      
      if (response.data.result) {
        console.log('✅ Vue Core query task created:');
        console.log(`   Task ID: ${response.data.result.id}`);
        console.log(`   Status: ${response.data.result.status.state}`);
        
        if (response.data.result.status.message) {
          console.log('\nResponse:');
          console.log(response.data.result.status.message.parts[0].text);
        }
      } else {
        console.error('❌ Error in response:', response.data.error);
      }
    } catch (error) {
      console.error('❌ Error sending Vue Core query:', (error as Error).message);
    }
    
    console.log('\n');
    
    // Step 7: Test Vuex query through the orchestrator
    console.log('Step 7: Test Vuex query through orchestrator');
    
    const jsonRpcVuexRequest = {
      jsonrpc: '2.0',
      id: 'test-4',
      method: 'tasks/send',
      params: {
        id: 'vuex-query-task',
        message: {
          role: 'user',
          parts: [{ type: 'text', text: 'How do I use Vuex for state management?' }]
        }
      }
    };
    
    try {
      const response = await axios.post(`${baseUrl}/agents/a2a/orchestrator`, jsonRpcVuexRequest);
      
      if (response.data.result) {
        console.log('✅ Vuex query task created:');
        console.log(`   Task ID: ${response.data.result.id}`);
        console.log(`   Status: ${response.data.result.status.state}`);
        
        if (response.data.result.status.message) {
          console.log('\nResponse:');
          console.log(response.data.result.status.message.parts[0].text);
        }
      } else {
        console.error('❌ Error in response:', response.data.error);
      }
    } catch (error) {
      console.error('❌ Error sending Vuex query:', (error as Error).message);
    }
    
    console.log('\n');
    console.log('Test script completed.');
    
  } catch (error) {
    console.error('Failed to run A2A test:', (error as Error).message);
  }
}

// Run the test
testA2A(); 